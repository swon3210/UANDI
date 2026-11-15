import { useTranslations } from 'next-intl';
import { ArrowDownRight, ArrowRight, ArrowUpRight, HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger, cn } from '@uandi/ui';
import {
  type ForexIndicators,
  type ForexTrend,
  type SupportedCurrency,
  getDisplayRate,
} from '@uandi/investment-core';
import { formatKrwRate } from '@/utils/currency';

type Props = {
  indicators: ForexIndicators;
  currency: SupportedCurrency;
};

type IndicatorKey = 'ma20' | 'ma60' | 'rsi14' | 'percentile52w' | 'percentile13w';

const INDICATOR_KEYS: IndicatorKey[] = ['ma20', 'ma60', 'rsi14', 'percentile52w', 'percentile13w'];

function formatRate(value: number | null, currency: SupportedCurrency): string {
  if (value === null) return '—';
  return formatKrwRate(getDisplayRate(value, currency));
}

function formatNumber(value: number | null, digits = 1): string {
  if (value === null) return '—';
  return value.toFixed(digits);
}

function getValue(
  key: IndicatorKey,
  indicators: ForexIndicators,
  currency: SupportedCurrency
): string {
  switch (key) {
    case 'ma20':
      return formatRate(indicators.ma20, currency);
    case 'ma60':
      return formatRate(indicators.ma60, currency);
    case 'rsi14':
      return formatNumber(indicators.rsi14, 1);
    case 'percentile52w':
      return indicators.percentile52w === null ? '—' : `${indicators.percentile52w.toFixed(0)}%`;
    case 'percentile13w':
      return indicators.percentile13w === null ? '—' : `${indicators.percentile13w.toFixed(0)}%`;
  }
}

const TREND_BADGE_CLASS: Record<ForexTrend, string> = {
  up: 'bg-coral-100 text-coral-700 border-coral-200',
  down: 'bg-sage-100 text-sage-700 border-sage-200',
  sideways: 'bg-muted text-muted-foreground border-border',
};

function TrendIcon({ trend }: { trend: ForexTrend }) {
  if (trend === 'up') return <ArrowUpRight size={14} aria-hidden />;
  if (trend === 'down') return <ArrowDownRight size={14} aria-hidden />;
  return <ArrowRight size={14} aria-hidden />;
}

export function IndicatorPanel({ indicators, currency }: Props) {
  const t = useTranslations('outer.forex');
  const trend = indicators.trend;
  const trendLabel = t(`trend.${trend}`);
  return (
    <div
      data-testid="indicator-panel"
      className="rounded-xl border border-border bg-card p-4 text-card-foreground"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('indicators.title')}
        </h3>
        <Popover>
          <PopoverTrigger
            data-testid="trend-badge"
            aria-label={t('trendAria', { trend: trendLabel })}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              TREND_BADGE_CLASS[trend]
            )}
          >
            <TrendIcon trend={trend} />
            <span>{trendLabel}</span>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-64 text-sm leading-relaxed">
            <p className="font-semibold">{trendLabel}</p>
            <p className="mt-1 text-muted-foreground">{t(`trendDescription.${trend}`)}</p>
            <p className="mt-2 text-xs text-muted-foreground/80">{t('trendBasis')}</p>
          </PopoverContent>
        </Popover>
      </div>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
        {INDICATOR_KEYS.map((key) => (
          <div key={key} className="flex items-baseline justify-between gap-2">
            <dt className="flex items-center gap-1 text-muted-foreground">
              <span>{t(`indicators.${key}.label`)}</span>
              <Popover>
                <PopoverTrigger
                  data-testid={`indicator-help-${key}`}
                  aria-label={t('indicators.helpAria', { label: t(`indicators.${key}.label`) })}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HelpCircle size={14} />
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-64 text-sm leading-relaxed">
                  <p className="font-semibold">{t(`indicators.${key}.label`)}</p>
                  <p className="mt-1 text-muted-foreground">{t(`indicators.${key}.description`)}</p>
                  <p className="mt-2 text-xs text-muted-foreground/80">
                    {t('indicators.glossary', { term: t(`indicators.${key}.term`) })}
                  </p>
                </PopoverContent>
              </Popover>
            </dt>
            <dd data-testid={`indicator-${key}`} className="font-semibold tabular-nums">
              {getValue(key, indicators, currency)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
