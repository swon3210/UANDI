'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PiggyBank, TrendingUp } from 'lucide-react';
import { getDisplayRate } from '@uandi/investment-core';
import { Badge } from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import { fetchForexRates } from '@/services/forex';
import { InvestmentEntryCard } from '@/components/investment/InvestmentEntryCard';

type PlaceholderCardProps = {
  Icon: ComponentType<{ size?: number }>;
  title: string;
  description: string;
  href: string;
  testId: string;
};

function PlaceholderCard({ Icon, title, description, href, testId }: PlaceholderCardProps) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="block rounded-xl border border-border bg-muted/40 p-4 text-card-foreground transition-colors hover:bg-accent/40"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon size={18} />
        </span>
        <div className="flex-1">
          <p className="flex items-center gap-2 text-base font-semibold">
            {title}
            <Badge variant="outline" className="text-xs">
              v1.1
            </Badge>
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export function OuterDashboard() {
  const usdQuery = useQuery({
    queryKey: ['forexRates', 'USD', '1m'],
    queryFn: () => fetchForexRates('USD', '1m'),
    staleTime: 30 * 60 * 1000,
  });

  const usdRate = usdQuery.data ? getDisplayRate(usdQuery.data.latest, 'USD') : undefined;
  const usdPrev =
    usdQuery.data?.prevClose !== null && usdQuery.data?.prevClose !== undefined
      ? getDisplayRate(usdQuery.data.prevClose, 'USD')
      : undefined;
  const usdDiffPercent =
    usdRate !== undefined && usdPrev !== undefined && usdPrev !== 0
      ? ((usdRate - usdPrev) / usdPrev) * 100
      : undefined;

  return (
    <>
      <PageHeader data-testid="outer-dashboard-header" />
      <main className="mx-auto max-w-md space-y-4 px-4 pb-20 pt-4">
        <InvestmentEntryCard
          currencyLabel="USD"
          rate={usdRate}
          diffPercent={usdDiffPercent}
          isLoading={usdQuery.isLoading}
        />
        <PlaceholderCard
          Icon={TrendingUp}
          title="투자"
          description="종목 보유·평가액 관리"
          href="/outer/investment"
          testId="outer-investment-placeholder"
        />
        <PlaceholderCard
          Icon={PiggyBank}
          title="적금"
          description="적금 만기·이율 추적"
          href="/outer/savings"
          testId="outer-savings-placeholder"
        />
      </main>
    </>
  );
}
