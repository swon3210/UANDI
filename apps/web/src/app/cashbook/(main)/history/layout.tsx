import type { ReactNode } from 'react';
import { CashbookSubNav } from '@/components/cashbook/CashbookSubNav';

export default function CashbookHistoryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CashbookSubNav />
      {children}
    </>
  );
}
