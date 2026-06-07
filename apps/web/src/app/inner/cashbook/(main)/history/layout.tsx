import type { ReactNode } from 'react';
import { CashbookSubNav } from '@/components/cashbook/CashbookSubNav';
import { BudgetAlertBannerHost } from '@/components/cashbook/BudgetAlertBannerHost';
import { PredictionRetroBannerHost } from '@/components/cashbook/PredictionRetroBannerHost';

export default function CashbookHistoryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CashbookSubNav />
      <BudgetAlertBannerHost />
      <PredictionRetroBannerHost />
      {children}
    </>
  );
}
