'use client';

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/shell/PageHeader';

export default function CashbookLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="가계부" data-testid="cashbook-header" />
      {children}
    </>
  );
}
