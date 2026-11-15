'use client';

import { useQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import {
  SUPPORTED_CURRENCIES,
  computeIndicators,
  computeRecommendation,
  getCurrenciesByCategory,
  type ForexRatesPayload,
  type SupportedCurrency,
} from '@uandi/investment-core';
import { fetchForexRates } from '@/services/forex';
import { CurrencyCard } from '@/components/investment/CurrencyCard';
import { dateFormat } from '@/utils/date';

export default function ForexListPage() {
  const t = useTranslations('outer.forex');
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

  const loadedPayloads = queries.map((q) => q.data).filter((d): d is ForexRatesPayload => !!d);
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
      <PageHeader title={t('title')} data-testid="forex-list-header" />
      <main className="mx-auto w-full max-w-md flex-1 space-y-5 px-4 pb-8 pt-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t('intro')}</p>
          {latestAsOf && (
            <p data-testid="forex-list-as-of" className="text-xs text-muted-foreground">
              {t('asOf', { date: dayjs(latestAsOf).format(dateFormat('full')) })}
              {latestFetchedAt && (
                <span className="ml-1 text-muted-foreground/70">
                  {t('updated', { time: dayjs(latestFetchedAt).format('HH:mm') })}
                </span>
              )}
            </p>
          )}
        </div>
        {groups.map(({ category, currencies }) => (
          <section key={category} data-testid={`forex-category-${category}`} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t(`categories.${category}`)}
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
  const t = useTranslations('outer.forex');
  if (query.isLoading || !query.data) {
    return <Skeleton data-testid={`forex-skeleton-${currency}`} className="h-[108px] rounded-xl" />;
  }

  if (query.error) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {t('loadFailed', { currency })}
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
      href={`/outer/forex/${currency}`}
    />
  );
}
