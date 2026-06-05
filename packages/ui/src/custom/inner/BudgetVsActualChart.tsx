'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../components/chart';
import { cn } from '../../lib/utils';

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

// 카테고리당 최소 폭(px) — 좁은 화면에서 라벨이 겹치면 가로 스크롤되도록 보장
const MIN_CATEGORY_WIDTH = 64;

export function BudgetVsActualChart({ data, className }: BudgetVsActualChartProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* 범례는 스크롤 영역 밖에 고정 — 가로 스크롤 시에도 항상 보이도록 */}
      <div className="mb-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        {Object.values(CHART_CONFIG).map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <div className="w-full overflow-x-auto">
        <ChartContainer
          config={CHART_CONFIG}
          data-testid="budget-vs-actual-chart"
          className="h-56 w-full"
          style={{ minWidth: data.length * MIN_CATEGORY_WIDTH }}
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
            <Bar dataKey="budget" fill={CHART_CONFIG.budget.color} radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" fill={CHART_CONFIG.actual.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
