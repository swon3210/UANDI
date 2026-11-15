import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowRight, ArrowUp, TrendingUp } from 'lucide-react';
import { cn, Skeleton } from '@uandi/ui';
import { formatKrwRate } from '@/utils/currency';

type Props = {
  currencyLabel?: string;
  rate?: number;
  diffPercent?: number;
  isLoading?: boolean;
};

export function InvestmentEntryCard({ currencyLabel, rate, diffPercent, isLoading }: Props) {
  const t = useTranslations('outer.entry');
  const isUp = (diffPercent ?? 0) > 0;
  const isDown = (diffPercent ?? 0) < 0;

  return (
    <Link
      href="/outer/forex"
      data-testid="investment-entry-card"
      className="block rounded-xl border border-border bg-card p-4 text-card-foreground transition-colors hover:bg-accent/40"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <TrendingUp size={18} />
          </span>
          <div>
            <p className="text-base font-semibold">{t('title')}</p>
            <p className="text-xs text-muted-foreground">
              {t('subtitle', { currency: currencyLabel ?? t('majorCurrencies') })}
            </p>
          </div>
        </div>
        <ArrowRight size={16} className="text-muted-foreground" />
      </div>

      {isLoading && (
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
      )}

      {!isLoading && rate !== undefined && (
        <div className="mt-3 flex items-baseline gap-2 tabular-nums">
          <span className="text-base font-semibold">{formatKrwRate(rate)}</span>
          {diffPercent !== undefined && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                isUp && 'text-destructive',
                isDown && 'text-blue-500',
                !isUp && !isDown && 'text-muted-foreground'
              )}
            >
              {isUp && <ArrowUp size={12} />}
              {isDown && <ArrowDown size={12} />}
              {isUp ? '+' : ''}
              {diffPercent.toFixed(2)}%
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
