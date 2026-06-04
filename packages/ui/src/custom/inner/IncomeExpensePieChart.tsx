'use client';

import { Cell, Pie, PieChart } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../components/chart';

export type PieSlice = {
  name: string;
  value: number;
};

export type IncomeExpensePieChartProps = {
  data: PieSlice[];
  className?: string;
};

// 카테고리/구분별 슬라이스 색 팔레트 (hex 고정 — 캡처 안전)
const SLICE_COLORS = [
  '#e8837a',
  '#4caf86',
  '#6366f1',
  '#f59e0b',
  '#0ea5e9',
  '#d946ef',
  '#14b8a6',
  '#f43f5e',
];

export function IncomeExpensePieChart({ data, className }: IncomeExpensePieChartProps) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.name, { label: d.name, color: SLICE_COLORS[i % SLICE_COLORS.length] }])
  );

  return (
    <ChartContainer
      config={config}
      data-testid="income-expense-pie"
      className={className ?? 'aspect-square w-full max-w-[280px] mx-auto'}
    >
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span className="font-mono tabular-nums">
                  {String(name)} {typeof value === 'number' ? value.toLocaleString() : value}원
                </span>
              )}
            />
          }
        />
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} strokeWidth={2}>
          {data.map((d, i) => (
            <Cell key={d.name} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
