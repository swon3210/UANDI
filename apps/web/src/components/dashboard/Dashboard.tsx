'use client';

import { PageHeader } from '@/components/shell/PageHeader';
import { CashbookTabs } from '@/components/cashbook/CashbookTabs';
import { NudgeButton } from '@/components/cashbook/NudgeButton';
import { useAuth } from '@/hooks/useAuth';
import { useServiceTourAutoOpen } from '@/hooks/useServiceTourAutoOpen';
import { BudgetDashboard } from './BudgetDashboard';

export function Dashboard() {
  const { user } = useAuth();
  const coupleId = user?.coupleId;

  // 첫 진입 시 말랑 가계부 온보딩 투어 1회 자동 노출 (커플 연결 사용자에 한함)
  useServiceTourAutoOpen(Boolean(coupleId));

  if (!coupleId) return null;

  return (
    <>
      <PageHeader title="대시보드" data-testid="dashboard-header" />
      <CashbookTabs />
      <main className="w-full max-w-md mx-auto px-4 pb-20 pt-4 space-y-4">
        <BudgetDashboard coupleId={coupleId} />
        <NudgeButton />
      </main>
    </>
  );
}
