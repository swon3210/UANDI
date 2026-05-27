import type { ReactNode } from 'react';
import { CashbookSubNav } from '@/components/cashbook/CashbookSubNav';
import { BudgetAlertBannerHost } from '@/components/cashbook/BudgetAlertBannerHost';

export default function CashbookHistoryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CashbookSubNav />
      <BudgetAlertBannerHost />
      {children}
    </>
  );
}
