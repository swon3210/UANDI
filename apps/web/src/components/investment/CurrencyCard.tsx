import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@uandi/ui';
import {
  CURRENCY_META,
  type ForexRecommendation,
  type SupportedCurrency,
  getDisplayRate,
} from '@uandi/investment-core';
import { BuyRecommendationBadge } from './BuyRecommendationBadge';

type Props = {
  currency: SupportedCurrency;
  rate: number;
  prevClose: number | null;
  recommendation: ForexRecommendation;
  href?: string;
};

function formatRate(value: number): string {
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CurrencyCard({ currency, rate, prevClose, recommendation, href }: Props) {
  const meta = CURRENCY_META[currency];
  const displayRate = getDisplayRate(rate, currency);
  const displayPrev = prevClose !== null ? getDisplayRate(prevClose, currency) : null;
  const diff = displayPrev !== null ? displayRate - displayPrev : 0;
  const diffPercent = displayPrev !== null && displayPrev !== 0 ? (diff / displayPrev) * 100 : 0;
  const isUp = diff > 0;
  const isDown = diff < 0;

  const content = (
    <div
      data-testid={`currency-card-${currency}`}
      className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground transition-colors hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-xl"
          >
            {meta.flag}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{currency}/KRW</span>
            <span className="text-xs text-muted-foreground">{meta.displayUnit}</span>
          </div>
        </div>
        <BuyRecommendationBadge recommendation={recommendation} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-2xl font-bold tabular-nums leading-none">
          {formatRate(displayRate)}
          <span className="ml-0.5 text-base font-medium text-muted-foreground">원</span>
        </div>
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
              {diffPercent.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
