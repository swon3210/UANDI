'use client';

import { Bar, BarChart, Cell, LabelList, ReferenceLine, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@uandi/ui';
import type { CategoryGroup } from '@/types';
import { formatCurrencyMan } from '@/utils/currency';

export type CategoryTrendPoint = {
  /** X축 라벨 (예: 5월) */
  label: string;
  amount: number;
  /** 기준 달이면 그룹 색, 아니면 회색 */
  isCurrent: boolean;
};

type Props = {
  points: CategoryTrendPoint[];
  /** 평소(중위값) 점선. null이면 그리지 않는다 */
  median: number | null;
  group: CategoryGroup;
};

const CURRENT_COLOR: Record<CategoryGroup, string> = {
  expense: 'hsl(var(--expense))',
  income: 'hsl(var(--income))',
};
const PAST_COLOR = 'hsl(var(--muted-foreground) / 0.35)';

function formatBarLabel(n: number): string {
  return n === 0 ? '' : `${formatCurrencyMan(n)}원`;
}

/** 최근 달들의 카테고리 금액 막대 + 평소 점선 (점선 설명은 호출부 캡션에서) */
export function CategoryTrendChart({ points, median, group }: Props) {
  const config: ChartConfig = {
    amount: { label: '금액', color: CURRENT_COLOR[group] },
  };
  return (
    <ChartContainer
      config={config}
      data-testid="category-analysis-chart"
      className="aspect-[16/9] w-full"
    >
      <BarChart data={points} margin={{ left: 4, right: 4, top: 20, bottom: 0 }}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} fontSize={11} />
        <YAxis hide domain={[0, 'auto']} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) => (
                <span className="font-mono tabular-nums">
                  {typeof value === 'number' ? Math.round(value).toLocaleString() : value}원
                </span>
              )}
            />
          }
        />
        {median !== null && median > 0 ? (
          <ReferenceLine y={median} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
        ) : null}
        {/* 보고서 스트리밍으로 페이지가 자주 다시 그려지므로 막대 애니메이션은 끈다 */}
        <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false}>
          {points.map((p) => (
            <Cell key={p.label} fill={p.isCurrent ? CURRENT_COLOR[group] : PAST_COLOR} />
          ))}
          <LabelList
            dataKey="amount"
            position="top"
            offset={4}
            fontSize={10}
            className="fill-muted-foreground"
            formatter={(label) => formatBarLabel(Number(label) || 0)}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
