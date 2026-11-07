'use client';

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/shell/PageHeader';
import { BackButton } from '@/components/shell/BackButton';

export default function CashbookLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="내역" data-testid="cashbook-header" leftSlot={<BackButton />} />
      {children}
    </>
  );
}
