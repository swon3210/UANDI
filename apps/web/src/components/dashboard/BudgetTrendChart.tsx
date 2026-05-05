'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@uandi/ui';
import type { TrendPoint } from '@/hooks/useDashboardData';
import type { GroupFilter } from '@/hooks/useDashboardData';

const COLOR_BY_GROUP: Record<GroupFilter, string> = {
  all: 'hsl(var(--primary))',
  expense: 'hsl(var(--expense))',
  income: 'hsl(var(--income))',
  flex: 'hsl(var(--primary))',
  investment: 'hsl(28 9% 54%)',
};

type Props = {
  data: TrendPoint[];
  group: GroupFilter;
};

function formatCompact(n: number): string {
  if (n >= 10_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function BudgetTrendChart({ data, group }: Props) {
  const config = {
    total: { label: '합계', color: COLOR_BY_GROUP[group] },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={config}
      data-testid="trend-chart"
      className="aspect-[16/9] w-full"
    >
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={40}
          tickFormatter={formatCompact}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value) => (
                <span className="font-mono tabular-nums">
                  {typeof value === 'number' ? value.toLocaleString() : value}원
                </span>
              )}
            />
          }
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
