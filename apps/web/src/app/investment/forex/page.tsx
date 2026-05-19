'use client';

import { useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ArrowLeft } from 'lucide-react';
import { Button, Header, Skeleton } from '@uandi/ui';
import {
  CATEGORY_LABEL,
  SUPPORTED_CURRENCIES,
  computeIndicators,
  computeRecommendation,
  getCurrenciesByCategory,
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
      staleTime: 5 * 60 * 1000,
    })),
  });

  const queryByCurrency = new Map<SupportedCurrency, Query>(
    SUPPORTED_CURRENCIES.map((currency, i) => [currency, queries[i]])
  );

  const groups = getCurrenciesByCategory();

  const loadedPayloads = queries
    .map((q) => q.data)
    .filter((d): d is ForexRatesPayload => !!d);
  const latestAsOf = loadedPayloads
    .map((d) => d.asOf)
    .sort()
    .at(-1);
  const latestFetchedAt = loadedPayloads
    .map((d) => d.fetchedAt)
    .sort()
    .at(-1);

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
      <main className="mx-auto w-full max-w-md flex-1 space-y-5 px-4 pb-16 pt-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            주요 통화의 최근 환율 추이와 매수·매도 신호를 확인하세요.
          </p>
          {latestAsOf && (
            <p
              data-testid="forex-list-as-of"
              className="text-xs text-muted-foreground"
            >
              {dayjs(latestAsOf).format('YYYY년 M월 D일')} ECB 종가 기준
              {latestFetchedAt && (
                <span className="ml-1 text-muted-foreground/70">
                  · {dayjs(latestFetchedAt).format('HH:mm')} 갱신
                </span>
              )}
            </p>
          )}
        </div>
        {groups.map(({ category, currencies }) => (
          <section
            key={category}
            data-testid={`forex-category-${category}`}
            className="space-y-2"
          >
            <h2 className="text-sm font-semibold text-muted-foreground">
              {CATEGORY_LABEL[category]}
            </h2>
            <div className="grid gap-3">
              {currencies.map((currency) => (
                <ForexListCard
                  key={currency}
                  currency={currency}
                  query={queryByCurrency.get(currency)!}
                />
              ))}
            </div>
          </section>
        ))}
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
