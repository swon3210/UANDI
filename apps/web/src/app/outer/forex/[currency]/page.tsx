'use client';

import { useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import { Button, Header, Skeleton, cn } from '@uandi/ui';
import {
  CURRENCY_META,
  computeRecommendation,
  getDisplayRate,
  isSupportedCurrency,
  type ForexRange,
} from '@uandi/investment-core';
import { useForexIndicators, useForexOutlook, useForexRates } from '@/hooks/useForex';
import { ExchangeRateChart } from '@/components/investment/ExchangeRateChart';
import { ForecastCard } from '@/components/investment/ForecastCard';
import { IndicatorPanel } from '@/components/investment/IndicatorPanel';
import { TimeRangeSelector } from '@/components/investment/TimeRangeSelector';
import { BuyRecommendationBadge } from '@/components/investment/BuyRecommendationBadge';

export default function ForexDetailPage() {
  const router = useRouter();
  const params = useParams<{ currency: string }>();
  const raw = params.currency?.toUpperCase() ?? '';

  if (!isSupportedCurrency(raw)) {
    notFound();
  }
  const currency = raw;

  const [range, setRange] = useState<ForexRange>('1m');
  const ratesQuery = useForexRates(currency, range);
  const indicators = useForexIndicators(ratesQuery.data?.points);
  const outlookQuery = useForexOutlook(
    currency,
    ratesQuery.data?.points,
    indicators,
    !!ratesQuery.data && !!indicators
  );

  const meta = CURRENCY_META[currency];
  const latest = ratesQuery.data?.latest;
  const prevClose = ratesQuery.data?.prevClose ?? null;
  const displayLatest = latest !== undefined ? getDisplayRate(latest, currency) : null;
  const displayPrev = prevClose !== null ? getDisplayRate(prevClose, currency) : null;
  const diff = displayLatest !== null && displayPrev !== null ? displayLatest - displayPrev : 0;
  const diffPercent =
    displayLatest !== null && displayPrev !== null && displayPrev !== 0
      ? (diff / displayPrev) * 100
      : 0;
  const isUp = diff > 0;
  const isDown = diff < 0;

  const recommendation = indicators ? computeRecommendation(indicators) : 'hold';
  const asOf = ratesQuery.data?.asOf;
  const fetchedAt = ratesQuery.data?.fetchedAt;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        data-testid="forex-detail-header"
        title={`${currency}/KRW`}
        leftSlot={
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="뒤로">
            <ArrowLeft size={20} />
          </Button>
        }
      />
      <main className="mx-auto w-full max-w-md flex-1 space-y-5 px-4 pb-8 pt-4">
        <section className="flex flex-col gap-2" data-testid="forex-detail-summary">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-2xl"
            >
              {meta.flag}
            </span>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">{meta.label}</span>
              <span className="text-xs text-muted-foreground">{meta.displayUnit} 기준</span>
            </div>
            <div className="ml-auto">
              {indicators && <BuyRecommendationBadge recommendation={recommendation} />}
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            {displayLatest !== null ? (
              <div className="text-3xl font-bold tabular-nums leading-none">
                {displayLatest.toLocaleString('ko-KR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="ml-1 text-lg font-medium text-muted-foreground">원</span>
              </div>
            ) : (
              <Skeleton className="h-9 w-40" />
            )}
            {displayPrev !== null && (
              <div
                className={cn(
                  'flex items-center gap-0.5 text-sm tabular-nums',
                  isUp && 'text-destructive',
                  isDown && 'text-blue-500',
                  !isUp && !isDown && 'text-muted-foreground'
                )}
              >
                {isUp && <ArrowUp size={14} />}
                {isDown && <ArrowDown size={14} />}
                <span className="font-medium">
                  {isUp ? '+' : ''}
                  {diff.toFixed(2)}원 ({isUp ? '+' : ''}
                  {diffPercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          {asOf && (
            <p data-testid="forex-detail-as-of" className="text-xs text-muted-foreground">
              {dayjs(asOf).format('YYYY년 M월 D일')} ECB 종가 기준
              {fetchedAt && (
                <span className="ml-1 text-muted-foreground/70">
                  · {dayjs(fetchedAt).format('HH:mm')} 갱신
                </span>
              )}
            </p>
          )}
        </section>

        <section className="space-y-3">
          <TimeRangeSelector value={range} onChange={setRange} />
          {ratesQuery.isLoading || !ratesQuery.data ? (
            <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          ) : ratesQuery.error ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              환율 데이터를 가져오지 못했어요
            </div>
          ) : (
            <ExchangeRateChart currency={currency} points={ratesQuery.data.points} />
          )}
        </section>

        {indicators && <IndicatorPanel indicators={indicators} currency={currency} />}

        <ForecastCard
          outlook={outlookQuery.data}
          recommendation={recommendation}
          isLoading={outlookQuery.isFetching}
          error={
            outlookQuery.error instanceof Error
              ? outlookQuery.error.message
              : outlookQuery.error
                ? 'AI 분석에 실패했어요'
                : null
          }
          onRefresh={() => outlookQuery.refetch()}
        />
      </main>
    </div>
  );
}
