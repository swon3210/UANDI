'use client';

import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { ChevronLeft, Settings, CalendarRange } from 'lucide-react';
import { Header, Button, Sheet, EmptyState, Skeleton } from '@uandi/ui';
import { userAtom } from '@/stores/auth.store';
import { useCashflowCalendar } from '@/hooks/useCashflowCalendar';
import { useCashflowNegativeAlert } from '@/hooks/useCashflowNegativeAlert';
import { useCashflowSettings, useUpdateCashflowSettings } from '@/hooks/useCashflowSettings';
import { CashflowCardList } from '@/components/cashbook/CashflowCardList';
import { CashflowNegativeBanner } from '@/components/cashbook/CashflowNegativeBanner';
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
              paydays: settings.paydays,
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

  const { cards, isConfigured, isLoading } = useCashflowCalendar(coupleId);
  const { negativeCard, dismiss } = useCashflowNegativeAlert(coupleId, cards);

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
        title="현금흐름 캘린더"
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
            description="현재 보유 현금과 결제일을 입력하면 결제일별로 남는 돈을 예측해 보여드려요"
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
            <CashflowCardList cards={cards} />
          </div>
        )}
      </main>
    </div>
  );
}
