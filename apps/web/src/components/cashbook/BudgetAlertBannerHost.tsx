'use client';

import dayjs from 'dayjs';
import { usePathname } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/stores/auth.store';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';
import { BudgetAlertBanner } from './BudgetAlertBanner';

export function BudgetAlertBannerHost() {
  const pathname = usePathname();
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const today = dayjs();
  const { alerts, dismissAlerts } = useBudgetAlerts(coupleId, today.year(), today.month() + 1);

  // 월간 페이지는 전체/카테고리 예산 상세를 이미 보여주므로 배너를 숨긴다.
  const onMonthly = pathname?.startsWith('/inner/cashbook/history/monthly') ?? false;
  if (onMonthly) return null;

  // 상시 배너는 실제 초과(over100/over120)만 노출한다.
  const overKeys = alerts
    .filter((a) => a.threshold === 'over100' || a.threshold === 'over120')
    .map((a) => a.key);
  if (overKeys.length === 0) return null;

  return (
    <div className="max-w-md mx-auto w-full px-4 pt-2">
      <BudgetAlertBanner alerts={alerts} onDismissAll={() => dismissAlerts(overKeys)} />
    </div>
  );
}
