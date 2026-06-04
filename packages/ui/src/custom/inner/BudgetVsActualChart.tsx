'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../components/chart';

export type BudgetVsActualPoint = {
  category: string;
  budget: number;
  actual: number;
};

export type BudgetVsActualChartProps = {
  data: BudgetVsActualPoint[];
  className?: string;
};

// 색은 CSS 변수 대신 hex 리터럴로 고정 — PNG/PDF 캡처 시 색 누락 방지
const CHART_CONFIG = {
  budget: { label: '예산', color: '#94a3b8' },
  actual: { label: '실적', color: '#e8837a' },
} satisfies ChartConfig;

function formatCompactKrw(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  return String(n);
}

export function BudgetVsActualChart({ data, className }: BudgetVsActualChartProps) {
  return (
    <ChartContainer
      config={CHART_CONFIG}
      data-testid="budget-vs-actual-chart"
      className={className ?? 'aspect-[16/10] w-full'}
    >
      <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={48}
          tickFormatter={formatCompactKrw}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
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
        <Bar dataKey="budget" fill={CHART_CONFIG.budget.color} radius={[4, 4, 0, 0]} />
        <Bar dataKey="actual" fill={CHART_CONFIG.actual.color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
