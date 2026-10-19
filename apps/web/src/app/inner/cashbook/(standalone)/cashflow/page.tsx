'use client';

import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { ChevronLeft, CalendarRange, Sparkles, Loader2, RefreshCw, Info } from 'lucide-react';
import { Header, Button, Sheet, EmptyState, Skeleton } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashflowCalendar } from '@/hooks/useCashflowCalendar';
import { useCashflowPrediction } from '@/hooks/useCashflowPrediction';
import { useCashflowNegativeAlert } from '@/hooks/useCashflowNegativeAlert';
import {
  useRecurrenceSuggestions,
  useMoveRecurrenceToNewCategory,
} from '@/hooks/useRecurrenceSuggestions';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useUpdateCashflowSettings } from '@/hooks/useCashflowSettings';
import { useDeletePrediction } from '@/hooks/usePredictions';
import { resolveInitialCashByUid, type CashflowMember } from '@/utils/cashflow';
import { CashflowCardList } from '@/components/cashbook/CashflowCardList';
import { CashflowBaselineCard } from '@/components/cashbook/CashflowBaselineCard';
import { CashflowNegativeBanner } from '@/components/cashbook/CashflowNegativeBanner';
import { CashbookTabs } from '@/components/cashbook/CashbookTabs';
import {
  RecurrenceSuggestionCard,
  type RecurrenceSuggestionView,
} from '@/components/cashbook/RecurrenceSuggestionCard';
import {
  CashflowSettingsForm,
  type CashflowSettingsFormValue,
} from '@/components/cashbook/CashflowSettingsForm';
import { CategoryForm } from '@/components/cashbook/CategoryForm';
import { SUB_GROUP_LABELS, recurrenceSubGroupFor } from '@/constants/default-categories';
import { buildRecurrencePayload } from '@/utils/recurrence-form';
import { formatDay } from '@/utils/date';
import type { CashbookCategory } from '@/types';

/**
 * 설정 시트 내용. overlay-kit은 열릴 때 React 트리에서 분리된 위치에 렌더돼
 * 내부에서 서버 상태 쿼리(멤버·설정)가 안정적으로 resolve되지 않으므로,
 * 페이지가 이미 확보한 members/initial 값을 props로 주입한다(저장 mutation만 내부 사용).
 */
function SettingsSheetContent({
  coupleId,
  members,
  initial,
  onClose,
}: {
  coupleId: string | null;
  members: CashflowMember[];
  initial?: CashflowSettingsFormValue;
  onClose: () => void;
}) {
  const updateMutation = useUpdateCashflowSettings(coupleId);

  return (
    <CashflowSettingsForm
      members={members}
      initial={initial}
      onSubmit={(value: CashflowSettingsFormValue) => updateMutation.mutate(value)}
      onClose={onClose}
    />
  );
}

/**
 * 'move' 제안 수락 시트: 변동 카테고리의 반복 패턴을 새 고정 지출/정기 수입 카테고리로 옮긴다.
 * CategoryForm을 구분 잠금(고정 지출/정기 수입) + 감지값(발생일·금액) prefill로 연다.
 * SettingsSheetContent와 같은 이유로 목록(takenNames·sortOrder)은 props로 주입하고 저장 mutation만 내부 사용.
 */
function MoveSuggestionSheetContent({
  coupleId,
  suggestion,
  source,
  takenNames,
  sortOrder,
  onClose,
}: {
  coupleId: string | null;
  suggestion: RecurrenceSuggestionView;
  /** 패턴이 잡힌 원본(변동) 카테고리 — 아이콘·색상 prefill용. */
  source?: Pick<CashbookCategory, 'icon' | 'color'>;
  takenNames: string[];
  sortOrder: number;
  onClose: () => void;
}) {
  const moveMutation = useMoveRecurrenceToNewCategory(coupleId);
  const targetSubGroup = recurrenceSubGroupFor(suggestion.type);

  return (
    <CategoryForm
      group={suggestion.type}
      lockedSubGroup={targetSubGroup}
      title={`${SUB_GROUP_LABELS[targetSubGroup]} 카테고리 만들기`}
      takenNames={takenNames}
      initialValues={{
        icon: source?.icon,
        color: source?.color,
        description: `'${suggestion.categoryName}'에서 ${suggestion.scheduleLabel} 반복되던 항목`,
        recurrence: {
          enabled: true,
          kind: 'dayOfMonth',
          dayOfMonth: suggestion.dayOfMonth,
          expectedAmount: suggestion.amount > 0 ? suggestion.amount : null,
        },
      }}
      onSubmit={async (data) => {
        await moveMutation.mutateAsync({
          suggestion,
          category: {
            name: data.name,
            icon: data.icon,
            color: data.color,
            description: data.description,
            examples: data.examples,
            sortOrder,
            recurrence: buildRecurrencePayload(data.recurrence),
          },
        });
      }}
      onClose={onClose}
    />
  );
}

export default function CashflowCalendarPage() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;

  // 과거 소비/수입 패턴 기반 LLM 예측. 진입 시 자동 1회 로드(캐시 영속) + "갱신" 버튼으로만 재추론.
  // 예측은 현금흐름 카드의 들어올/나갈/남는 돈에 반영된다.
  const { predictions, refresh, isPending, hasRun, ranAt } = useCashflowPrediction(coupleId);
  const {
    cards,
    settings,
    isConfigured,
    isLoading,
    initialCash,
    initialDate,
    startingBalance,
    members,
  } = useCashflowCalendar(coupleId, predictions);
  const { negativeCard, dismiss } = useCashflowNegativeAlert(coupleId, cards);
  const {
    suggestions,
    accept: acceptSuggestion,
    dismiss: dismissSuggestion,
  } = useRecurrenceSuggestions(coupleId);
  // 'move' 제안 시트에 넘길 이름 중복 목록·정렬 순서(useRecurrenceSuggestions와 같은 쿼리 캐시).
  const { data: categories } = useCashbookCategories(coupleId);
  const deletePredictionMutation = useDeletePrediction(coupleId);

  const openMoveSuggestion = (s: RecurrenceSuggestionView) => {
    const all = categories ?? [];
    // 내역은 카테고리 이름으로 연결되므로 같은 group 안에서는 이름이 겹치면 안 된다.
    const takenNames = all.filter((c) => c.group === s.type).map((c) => c.name);
    const sortOrder = all.filter((c) => c.group === s.type && c.parentCategoryId === null).length;
    const source = all.find((c) => c.id === s.categoryId);
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <MoveSuggestionSheetContent
          coupleId={coupleId}
          suggestion={s}
          source={source}
          takenNames={takenNames}
          sortOrder={sortOrder}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  const handleAcceptSuggestion = (s: RecurrenceSuggestionView) => {
    if (s.kind === 'move') {
      openMoveSuggestion(s);
      return;
    }
    acceptSuggestion(s);
  };

  const handleDeletePrediction = (txnId: string) => {
    deletePredictionMutation.mutate(txnId);
  };

  const settingsInitial: CashflowSettingsFormValue | undefined = settings
    ? {
        initialCashByUid: resolveInitialCashByUid(
          members.map((m) => m.uid),
          settings
        ),
        initialDate: settings.initialDate.toDate(),
      }
    : undefined;

  const openSettings = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SettingsSheetContent
          coupleId={coupleId}
          members={members}
          initial={settingsInitial}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="현금흐름"
        leftSlot={
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ChevronLeft size={20} />
          </Button>
        }
      />

      <CashbookTabs />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
          </div>
        ) : !isConfigured ? (
          <EmptyState
            icon={<CalendarRange size={48} className="text-muted-foreground" />}
            title="현금흐름을 보려면 설정이 필요해요"
            description="기준 날짜에 가지고 있던 현금(최초 현금)을 넣으면, 그 뒤로 기록한 수입·지출을 더해 오늘 잔액과 앞으로의 날짜별 남는 돈을 예측해 드려요"
            action={
              <Button onClick={openSettings} data-testid="cashflow-setup-button">
                최초 현금 설정하기
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <CashflowBaselineCard
              todayBalance={startingBalance}
              initialCash={initialCash}
              initialDate={initialDate}
              onEdit={openSettings}
            />

            {negativeCard && (
              <CashflowNegativeBanner
                label={negativeCard.label}
                balance={negativeCard.balance}
                subLabel={formatDay(negativeCard.endDate)}
                onDismiss={dismiss}
              />
            )}
            {suggestions.length > 0 && (
              <div className="space-y-2" data-testid="recurrence-suggestion-list">
                {suggestions.map((s) => (
                  <RecurrenceSuggestionCard
                    key={s.categoryId}
                    suggestion={s}
                    onAccept={() => handleAcceptSuggestion(s)}
                    onDismiss={() => dismissSuggestion(s)}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 rounded-lg border border-coral-100 bg-coral-50/40 px-3 py-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-xs font-medium text-coral-600">
                  <Sparkles size={13} aria-hidden />
                  AI 예상 내역
                </p>
                <p
                  className="mt-0.5 text-[11px] text-muted-foreground"
                  data-testid="cashflow-predict-status"
                >
                  {isPending
                    ? 'AI가 예상 내역을 불러오는 중…'
                    : hasRun
                      ? predictions.length > 0
                        ? `${predictions.length}건이 현금흐름에 반영됐어요${ranAt ? ` · ${dayjs(ranAt).format('M월 D일 HH:mm')} 기준` : ''}`
                        : '예상할 만한 패턴을 찾지 못했어요'
                      : '곧 예상 내역을 불러올게요'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-coral-200 text-coral-600 hover:bg-coral-50 hover:text-coral-700"
                onClick={refresh}
                disabled={isPending}
                data-testid="cashflow-predict-button"
              >
                {isPending ? (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                ) : (
                  <RefreshCw size={14} className="mr-1" />
                )}
                갱신
              </Button>
            </div>

            <div
              className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground"
              data-testid="cashflow-prediction-guide"
            >
              <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
              <p>
                <span className="text-coral-500">◇</span> 표시는 아직 확정되지 않은 예측이에요. 직접
                등록한 <b className="font-medium text-foreground">정기 발생</b>과 과거 소비·수입
                패턴을 분석한 <b className="font-medium text-foreground">AI 추론</b>으로 계산해요.
                각 항목을 펼치면 어떤 근거로 잡혔는지 볼 수 있어요.
              </p>
            </div>

            <CashflowCardList cards={cards} onDeletePrediction={handleDeletePrediction} />
          </div>
        )}
      </main>
    </div>
  );
}
