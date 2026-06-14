'use client';

import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import dayjs from 'dayjs';
import { ChevronLeft, Settings, CalendarRange } from 'lucide-react';
import { Header, Button, Sheet, EmptyState, Skeleton } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashflowCalendar } from '@/hooks/useCashflowCalendar';
import { useCashflowNegativeAlert } from '@/hooks/useCashflowNegativeAlert';
import { useRecurrenceSuggestions } from '@/hooks/useRecurrenceSuggestions';
import { useCashflowSettings, useUpdateCashflowSettings } from '@/hooks/useCashflowSettings';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { useAddPrediction, useDeletePrediction } from '@/hooks/usePredictions';
import { CashflowCardList } from '@/components/cashbook/CashflowCardList';
import { CashflowNegativeBanner } from '@/components/cashbook/CashflowNegativeBanner';
import { CashbookTabs } from '@/components/cashbook/CashbookTabs';
import { RecurrenceSuggestionCard } from '@/components/cashbook/RecurrenceSuggestionCard';
import {
  CashflowSettingsForm,
  type CashflowSettingsFormValue,
} from '@/components/cashbook/CashflowSettingsForm';
import { EntryForm } from '@/components/cashbook/EntryForm';
import { formatDay } from '@/utils/date';
import type { CashflowCardData } from '@/utils/cashflow';

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

/**
 * "예측 추가" 시트. 기존 EntryForm을 재사용해 예측을 만든다(source='calendar').
 * 시트 안에서 카테고리를 다시 구독해 최신 목록으로 채운다.
 */
function AddPredictionSheetContent({
  coupleId,
  uid,
  defaultDate,
  onClose,
}: {
  coupleId: string | null;
  uid: string;
  defaultDate: Date;
  onClose: () => void;
}) {
  const { data: categories } = useCashbookCategories(coupleId);
  const addPredictionMutation = useAddPrediction(coupleId);

  return (
    <EntryForm
      categories={categories ?? []}
      coupleId={coupleId}
      createdBy={uid}
      title="예측 추가"
      prefill={{ date: dayjs(defaultDate).format('YYYY-MM-DD') }}
      onSubmit={(data) =>
        addPredictionMutation.mutate({
          createdBy: uid,
          source: 'calendar',
          status: 'predicted',
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date,
          recurrenceKey: null,
          confidence: 1,
          rejectedUntil: null,
          linkedEntryId: null,
          promptDismissed: false,
        })
      }
      onClose={onClose}
    />
  );
}

export default function CashflowCalendarPage() {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? '';

  const { cards, isConfigured, isLoading } = useCashflowCalendar(coupleId);
  const { negativeCard, dismiss } = useCashflowNegativeAlert(coupleId, cards);
  const {
    suggestions,
    accept: acceptSuggestion,
    dismiss: dismissSuggestion,
  } = useRecurrenceSuggestions(coupleId);
  const deletePredictionMutation = useDeletePrediction(coupleId);

  const handleAddPrediction = (card: CashflowCardData) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <AddPredictionSheetContent
          coupleId={coupleId}
          uid={uid}
          defaultDate={card.endDate}
          onClose={() => {
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

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
            <CashflowCardList
              cards={cards}
              onAddPrediction={handleAddPrediction}
              onDeletePrediction={handleDeletePrediction}
            />
          </div>
        )}
      </main>
    </div>
  );
}
