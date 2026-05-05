'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  EmptyState,
  type ChartConfig,
} from '@uandi/ui';
import type { TrendByCategoryPoint } from '@/hooks/useDashboardData';
import type { CategoryOption } from './CategorySelector';

type Props = {
  data: TrendByCategoryPoint[];
  selectedCategories: CategoryOption[];
};

function formatCompact(n: number): string {
  if (n >= 10_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function BudgetTrendChart({ data, selectedCategories }: Props) {
  if (selectedCategories.length === 0) {
    return (
      <div data-testid="trend-chart">
        <EmptyState
          icon={<LineChartIcon size={32} />}
          title="비교할 카테고리를 선택해주세요"
          description="아래 칩에서 카테고리를 골라 추이를 비교할 수 있어요"
        />
      </div>
    );
  }

  const config = selectedCategories.reduce<ChartConfig>((acc, c) => {
    acc[c.name] = { label: c.name, color: c.color };
    return acc;
  }, {});

  return (
    <ChartContainer
      config={config}
      data-testid="trend-chart"
      className="aspect-[16/9] w-full"
    >
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
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
              formatter={(value, name) => (
                <span className="font-mono tabular-nums">
                  {String(name)}{' '}
                  {typeof value === 'number' ? value.toLocaleString() : value}원
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {selectedCategories.map((c) => (
          <Line
            key={c.name}
            type="monotone"
            dataKey={c.name}
            stroke={c.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
