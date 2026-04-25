'use client';

import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/stores/auth.store';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';
import { BudgetAlertBanner } from './BudgetAlertBanner';

export function BudgetAlertBannerHost() {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const today = dayjs();
  const { alerts, dismissAlert } = useBudgetAlerts(coupleId, today.year(), today.month() + 1);

  if (alerts.length === 0) return null;

  return (
    <div className="max-w-md mx-auto w-full px-4 pt-2">
      <BudgetAlertBanner alerts={alerts} onDismiss={dismissAlert} />
    </div>
  );
}
