'use client';

import { PageHeader } from '@/components/shell/PageHeader';
import { CashbookTabs } from '@/components/cashbook/CashbookTabs';
import { useAuth } from '@/hooks/useAuth';
import { BudgetDashboard } from './BudgetDashboard';

export function Dashboard() {
  const { user } = useAuth();
  const coupleId = user?.coupleId;

  if (!coupleId) return null;

  return (
    <>
      <PageHeader title="대시보드" data-testid="dashboard-header" />
      <CashbookTabs />
      <main className="w-full max-w-md mx-auto px-4 pb-20 pt-4 space-y-4">
        <BudgetDashboard coupleId={coupleId} />
      </main>
    </>
  );
}
