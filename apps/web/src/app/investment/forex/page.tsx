'use client';

import { useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button, Header, Skeleton } from '@uandi/ui';
import {
  SUPPORTED_CURRENCIES,
  computeIndicators,
  computeRecommendation,
  type ForexRatesPayload,
  type SupportedCurrency,
} from '@uandi/investment-core';
import { fetchForexRates } from '@/services/forex';
import { CurrencyCard } from '@/components/investment/CurrencyCard';

export default function ForexListPage() {
  const router = useRouter();

  const queries = useQueries({
    queries: SUPPORTED_CURRENCIES.map((currency) => ({
      queryKey: ['forexRates', currency, '1y'],
      queryFn: () => fetchForexRates(currency, '1y'),
      staleTime: 30 * 60 * 1000,
    })),
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        data-testid="forex-list-header"
        title="환테크"
        leftSlot={
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="뒤로">
            <ArrowLeft size={20} />
          </Button>
        }
      />
      <main className="mx-auto w-full max-w-md flex-1 space-y-3 px-4 pb-16 pt-4">
        <p className="text-sm text-muted-foreground">
          주요 통화의 최근 환율 추이와 매수·매도 신호를 확인하세요.
        </p>
        <div className="grid gap-3">
          {SUPPORTED_CURRENCIES.map((currency, i) => (
            <ForexListCard key={currency} currency={currency} query={queries[i]} />
          ))}
        </div>
      </main>
    </div>
  );
}

type Query = {
  data: ForexRatesPayload | undefined;
  isLoading: boolean;
  error: unknown;
};

function ForexListCard({ currency, query }: { currency: SupportedCurrency; query: Query }) {
  if (query.isLoading || !query.data) {
    return <Skeleton data-testid={`forex-skeleton-${currency}`} className="h-[108px] rounded-xl" />;
  }

  if (query.error) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {currency} 환율을 가져오지 못했어요
      </div>
    );
  }

  const indicators = computeIndicators(query.data.points);
  const recommendation = computeRecommendation(indicators);

  return (
    <CurrencyCard
      currency={currency}
      rate={query.data.latest}
      prevClose={query.data.prevClose}
      recommendation={recommendation}
      href={`/investment/forex/${currency}`}
    />
  );
}
