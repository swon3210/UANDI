'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import { Button, EmptyState } from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';

export default function OuterInvestmentPage() {
  const t = useTranslations('outer');
  return (
    <>
      <PageHeader data-testid="outer-investment-header" title={t('dashboard.investmentTitle')} />
      <main className="mx-auto max-w-md px-4 pb-20 pt-4">
        <EmptyState
          icon={<TrendingUp size={48} />}
          title={t('placeholder.investmentTitle')}
          description={t('placeholder.investmentDescription')}
          action={
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/outer/forex">{t('placeholder.goForex')}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/outer">{t('placeholder.goHome')}</Link>
              </Button>
            </div>
          }
        />
      </main>
    </>
  );
}
