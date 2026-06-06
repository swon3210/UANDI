'use client';

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  EmptyState,
  type ChartConfig,
} from '@uandi/ui';
import type { CategorySlice } from '@/hooks/useDashboardData';

type Props = {
  /** 비교할 카테고리. 금액 내림차순 정렬 상태를 권장. */
  data: CategorySlice[];
};

function formatCompact(n: number): string {
  if (n >= 10_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const ROW_HEIGHT = 40;

export function CategoryBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div data-testid="trend-chart">
        <EmptyState
          icon={<BarChart3 size={32} />}
          title="비교할 카테고리를 선택해주세요"
          description="아래 칩에서 카테고리를 골라 금액을 비교할 수 있어요"
        />
      </div>
    );
  }

  const config = data.reduce<ChartConfig>((acc, c) => {
    acc[c.category] = { label: c.category, color: c.color };
    return acc;
  }, {});

  const chartHeight = data.length * ROW_HEIGHT + 16;

  return (
    <ChartContainer
      config={config}
      data-testid="trend-chart"
      className="aspect-auto w-full"
      style={{ height: chartHeight }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 48, top: 4, bottom: 4 }}>
        <XAxis type="number" dataKey="amount" hide />
        <YAxis
          type="category"
          dataKey="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={72}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => (
                <span className="font-mono tabular-nums">
                  {String(name)} {typeof value === 'number' ? value.toLocaleString() : value}원
                </span>
              )}
            />
          }
        />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((slice) => (
            <Cell key={slice.category} fill={slice.color} />
          ))}
          <LabelList
            dataKey="amount"
            position="right"
            offset={8}
            className="fill-muted-foreground"
            fontSize={11}
            formatter={(label) => formatCompact(Number(label) || 0)}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
