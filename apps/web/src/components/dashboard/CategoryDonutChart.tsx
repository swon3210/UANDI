'use client';

import { Cell, Pie, PieChart } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  EmptyState,
  type ChartConfig,
} from '@uandi/ui';
import type { CategorySlice } from '@/hooks/useDashboardData';

type Props = {
  data: CategorySlice[];
};

export function CategoryDonutChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div data-testid="category-donut">
        <EmptyState
          icon={<PieChartIcon size={32} />}
          title="카테고리 내역이 없어요"
          description="다른 그룹을 선택하거나 기간을 바꿔보세요"
        />
      </div>
    );
  }

  const config = data.reduce<ChartConfig>((acc, slice) => {
    acc[slice.category] = { label: slice.category, color: slice.color };
    return acc;
  }, {});

  return (
    <div data-testid="category-donut" className="flex flex-col gap-3">
      <ChartContainer config={config} className="mx-auto aspect-square h-[180px] w-[180px]">
        <PieChart>
          <ChartTooltip
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
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            innerRadius={50}
            outerRadius={80}
            strokeWidth={2}
          >
            {data.map((slice) => (
              <Cell key={slice.category} fill={slice.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        {data.map((slice) => {
          const pct = total > 0 ? Math.round((slice.amount / total) * 100) : 0;
          return (
            <li key={slice.category} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-muted-foreground">{slice.category}</span>
              <span className="ml-auto font-mono tabular-nums">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
