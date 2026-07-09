'use client';

import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import {
  ChevronLeft,
  Settings,
  CalendarRange,
  Sparkles,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Header, Button, Sheet, EmptyState, Skeleton } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashflowCalendar } from '@/hooks/useCashflowCalendar';
import { useCashflowPrediction } from '@/hooks/useCashflowPrediction';
import { useCashflowNegativeAlert } from '@/hooks/useCashflowNegativeAlert';
import { useRecurrenceSuggestions } from '@/hooks/useRecurrenceSuggestions';
import { useCashflowSettings, useUpdateCashflowSettings } from '@/hooks/useCashflowSettings';
import { useDeletePrediction } from '@/hooks/usePredictions';
import { CashflowCardList } from '@/components/cashbook/CashflowCardList';
import { CashflowBaselineCard } from '@/components/cashbook/CashflowBaselineCard';
import { CashflowNegativeBanner } from '@/components/cashbook/CashflowNegativeBanner';
import { CashbookTabs } from '@/components/cashbook/CashbookTabs';
import { RecurrenceSuggestionCard } from '@/components/cashbook/RecurrenceSuggestionCard';
import {
  CashflowSettingsForm,
  type CashflowSettingsFormValue,
} from '@/components/cashbook/CashflowSettingsForm';
import { formatDay } from '@/utils/date';

/**
 * 설정 시트 내용. overlay-kit은 open 시점 props를 클로저로 캡처하므로,
 * 시트 안에서 설정을 다시 구독해 최신 값으로 폼을 채운다(가계부 필터 시트와 동일 패턴).
 */
function SettingsSheetContent({
  coupleId,
  onClose,
}: {
  coupleId: string | null;
  onClose: () => void;
}) {
  const { data: settings } = useCashflowSettings(coupleId);
  const updateMutation = useUpdateCashflowSettings(coupleId);

  return (
    <CashflowSettingsForm
      initial={settings ? { currentCash: settings.currentCash } : undefined}
      onSubmit={(value: CashflowSettingsFormValue) => updateMutation.mutate(value)}
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
  const { cards, settings, isConfigured, isLoading } = useCashflowCalendar(coupleId, predictions);
  const { negativeCard, dismiss } = useCashflowNegativeAlert(coupleId, cards);
  const {
    suggestions,
    accept: acceptSuggestion,
    dismiss: dismissSuggestion,
  } = useRecurrenceSuggestions(coupleId);
  const deletePredictionMutation = useDeletePrediction(coupleId);

  const handleDeletePrediction = (txnId: string) => {
    deletePredictionMutation.mutate(txnId);
  };

  const openSettings = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SettingsSheetContent
          coupleId={coupleId}
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
        rightSlot={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={openSettings}
            aria-label="현금흐름 설정"
            data-testid="cashflow-settings-button"
          >
            <Settings size={20} />
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
            description="지금 가진 현금(시작 현금)을 넣으면, 그 금액에서 시작해 앞으로 들어오고 나갈 돈을 반영한 날짜별 남는 돈을 예측해 드려요"
            action={
              <Button onClick={openSettings} data-testid="cashflow-setup-button">
                시작 현금 설정하기
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <CashflowBaselineCard amount={settings?.currentCash ?? 0} onEdit={openSettings} />

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
                    onAccept={() => acceptSuggestion(s)}
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
                <span className="text-coral-500">◇</span> 표시는 아직 확정되지 않은 예측이에요.
                직접 등록한 <b className="font-medium text-foreground">정기 발생</b>과 과거 소비·수입
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
