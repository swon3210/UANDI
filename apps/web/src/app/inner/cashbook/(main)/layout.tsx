'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shell/PageHeader';
import { BackButton } from '@/components/shell/BackButton';

export default function CashbookLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('dashboard');
  return (
    <>
      <PageHeader
        title={t('historyTitle')}
        data-testid="cashbook-header"
        leftSlot={<BackButton />}
      />
      {children}
    </>
  );
}
