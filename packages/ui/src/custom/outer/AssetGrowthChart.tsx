'use client';

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

// AssetAllocationEditor의 버킷 색상과 일치 (emerald / indigo / amber / fuchsia / sky)
const CHART_CONFIG = {
  savings: { label: '예적금', color: '#10b981' },
  stocks: { label: '주식', color: '#6366f1' },
  realEstate: { label: '부동산', color: '#f59e0b' },
  crypto: { label: '코인', color: '#d946ef' },
  forex: { label: '외환', color: '#0ea5e9' },
} satisfies ChartConfig;

function formatCompactKrw(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000_000) return `${Math.round(n / 10_000)}만`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  return String(n);
}

export function AssetGrowthChart({ data, className }: AssetGrowthChartProps) {
  return (
    <ChartContainer
      config={CHART_CONFIG}
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
          tickFormatter={(y) => `${y}년`}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={60}
          tickFormatter={formatCompactKrw}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `${label}년 후`}
              formatter={(value, name) => (
                <span className="font-mono tabular-nums">
                  {CHART_CONFIG[name as keyof typeof CHART_CONFIG]?.label ?? String(name)}{' '}
                  {typeof value === 'number' ? value.toLocaleString() : value}원
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {(['savings', 'stocks', 'realEstate', 'crypto', 'forex'] as const).map((key) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="asset"
            stroke={CHART_CONFIG[key].color}
            fill={CHART_CONFIG[key].color}
            fillOpacity={0.35}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
