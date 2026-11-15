'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'use-intl';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../components/chart';

export type AssetGrowthPoint = {
  year: number;
  savings: number;
  stocks: number;
  realEstate: number;
  crypto: number;
  forex: number;
};

export type AssetGrowthChartProps = {
  data: AssetGrowthPoint[];
  className?: string;
};

const BUCKET_KEYS = ['savings', 'stocks', 'realEstate', 'crypto', 'forex'] as const;
type BucketKey = (typeof BUCKET_KEYS)[number];

// AssetAllocationEditor의 버킷 색상과 일치 (emerald / indigo / amber / fuchsia / sky)
const BUCKET_COLORS: Record<BucketKey, string> = {
  savings: '#10b981',
  stocks: '#6366f1',
  realEstate: '#f59e0b',
  crypto: '#d946ef',
  forex: '#0ea5e9',
};

/** 축 눈금용 축약 원화. ko: 만/억 단위, en: "₩12.3M" 같은 compact 표기 */
function formatCompactKrw(n: number, locale: string): string {
  if (locale === 'en') {
    if (n < 1_000) return String(n);
    return `₩${n.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })}`;
  }
  return formatCompactKrwKo(n);
}

function formatCompactKrwKo(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  return String(n);
}

/** 툴팁용 원화. ko "12,000원" / en "₩12,000" */
function formatKrw(n: number, locale: string): string {
  const rounded = Math.round(n);
  return locale === 'en' ? `₩${rounded.toLocaleString('en-US')}` : formatKrwKo(rounded);
}

function formatKrwKo(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function AssetGrowthChart({ data, className }: AssetGrowthChartProps) {
  const t = useTranslations('ui.assets');
  const locale = useLocale();
  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        BUCKET_KEYS.map((key) => [key, { label: t(`buckets.${key}`), color: BUCKET_COLORS[key] }])
      ) as Record<BucketKey, { label: string; color: string }> satisfies ChartConfig,
    [t]
  );

  return (
    <ChartContainer
      config={chartConfig}
      data-testid="projection-chart"
      className={className ?? 'aspect-[16/10] w-full'}
    >
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(y) => t('yearTick', { year: y })}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={60}
          tickFormatter={(n: number) => formatCompactKrw(n, locale)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(label) => t('yearsLater', { year: Number(label) })}
              formatter={(value, name) => (
                <span className="font-mono tabular-nums">
                  {chartConfig[name as BucketKey]?.label ?? String(name)}{' '}
                  {typeof value === 'number' ? formatKrw(value, locale) : value}
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {BUCKET_KEYS.map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="asset"
            stroke={BUCKET_COLORS[key]}
            fill={BUCKET_COLORS[key]}
            fillOpacity={0.35}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
