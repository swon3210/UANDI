import type { ReactNode } from 'react';
import { CashbookTabs } from '@/components/cashbook/CashbookTabs';
import { BudgetAlertBannerHost } from '@/components/cashbook/BudgetAlertBannerHost';
import { PredictionRetroBannerHost } from '@/components/cashbook/PredictionRetroBannerHost';

export default function CashbookHistoryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CashbookTabs />
      <BudgetAlertBannerHost />
      <PredictionRetroBannerHost />
      {children}
    </>
  );
}
