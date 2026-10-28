import type { ReactNode } from 'react';
import { BudgetAlertBannerHost } from '@/components/cashbook/BudgetAlertBannerHost';
import { PredictionRetroBannerHost } from '@/components/cashbook/PredictionRetroBannerHost';

export default function CashbookHistoryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BudgetAlertBannerHost />
      <PredictionRetroBannerHost />
      {children}
    </>
  );
}
