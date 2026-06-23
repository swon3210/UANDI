'use client';

import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { ChevronLeft, Settings, CalendarRange, Sparkles, Loader2 } from 'lucide-react';
import { Header, Button, Sheet, EmptyState, Skeleton } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashflowCalendar } from '@/hooks/useCashflowCalendar';
import { useCashflowPrediction } from '@/hooks/useCashflowPrediction';
import { useCashflowNegativeAlert } from '@/hooks/useCashflowNegativeAlert';
import { useRecurrenceSuggestions } from '@/hooks/useRecurrenceSuggestions';
import { useCashflowSettings, useUpdateCashflowSettings } from '@/hooks/useCashflowSettings';
import { useDeletePrediction } from '@/hooks/usePredictions';
import { CashflowCardList } from '@/components/cashbook/CashflowCardList';
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
      initial={
        settings
          ? {
              currentCash: settings.currentCash,
              variableMode: settings.variableMode,
            }
          : undefined
      }
      onSubmit={(value: CashflowSettingsFormValue) => updateMutation.mutate(value)}
      onClose={onClose}
    />
  );
}

export default function CashflowCalendarPage() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;

  // 과거 소비/수입 패턴 기반 LLM 예측(표시 전용, 잔액 미반영). 버튼을 누를 때마다 호출.
  const { predictions, run, isPending, hasRun } = useCashflowPrediction(coupleId);
  const { cards, isConfigured, isLoading } = useCashflowCalendar(coupleId, predictions);
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
            description="현재 보유 현금과 큰 지출 예정일(월세·관리비·대출이자 등)을 입력하면 그 날짜별로 남는 돈을 예측해 보여드려요"
            action={
              <Button onClick={openSettings} data-testid="cashflow-setup-button">
                설정하기
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
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

            <div className="space-y-1.5">
              <Button
                variant="outline"
                className="w-full border-coral-200 text-coral-600 hover:bg-coral-50 hover:text-coral-700"
                onClick={run}
                disabled={isPending}
                data-testid="cashflow-predict-button"
              >
                {isPending ? (
                  <Loader2 size={16} className="mr-1.5 animate-spin" />
                ) : (
                  <Sparkles size={16} className="mr-1.5" />
                )}
                {isPending ? 'AI가 분석 중…' : 'AI로 예상 내역 보기'}
              </Button>
              {hasRun && !isPending && (
                <p
                  className="text-center text-xs text-muted-foreground"
                  data-testid="cashflow-predict-result"
                >
                  {predictions.length > 0
                    ? `AI가 ${predictions.length}건의 예상 내역을 카드에 추가했어요 (참고용)`
                    : '예상할 만한 패턴을 찾지 못했어요'}
                </p>
              )}
            </div>

            <CashflowCardList cards={cards} onDeletePrediction={handleDeletePrediction} />
          </div>
        )}
      </main>
    </div>
  );
}
