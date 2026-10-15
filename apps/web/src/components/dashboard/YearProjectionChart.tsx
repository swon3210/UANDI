'use client';

import { Bar, BarChart, Cell, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronRight } from 'lucide-react';
import { Button, ChartContainer, type ChartConfig } from '@uandi/ui';
import type { CategoryGroup } from '@/types';
import { formatCurrency, formatCurrencyMan } from '@/utils/currency';
import type { YearProjection, YearProjectionMonth } from '@/utils/upcoming-fixed';
import { HATCH_STYLE } from './ActualProjectedBar';

type Props = {
  projection: YearProjection;
  group: CategoryGroup;
  /** 올해 남은 예정 건수. 0이면 예정 칩을 숨긴다 */
  upcomingCount: number;
  /** 예정 칩 클릭 → 항목 목록 시트 */
  onUpcomingClick: () => void;
};

const FILL: Record<CategoryGroup, string> = {
  expense: 'hsl(var(--expense))',
  income: 'hsl(var(--income))',
};

const HATCH_FILL: Record<CategoryGroup, string> = {
  expense: 'hsl(var(--expense) / 0.6)',
  income: 'hsl(var(--income) / 0.6)',
};

const GROUP_LABEL: Record<CategoryGroup, string> = {
  expense: '지출',
  income: '수입',
};

function YearTooltip({
  active,
  payload,
  group,
}: {
  active?: boolean;
  payload?: Array<{ payload: YearProjectionMonth }>;
  group: CategoryGroup;
}) {
  const m = payload?.[0]?.payload;
  if (!active || !m) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-md">
      <div className="text-muted-foreground">
        {m.month}월 {GROUP_LABEL[group]}
      </div>
      {m.actual > 0 ? (
        <div className="tabular-nums">
          실제 <span className="font-semibold">{formatCurrency(m.actual)}</span>
        </div>
      ) : null}
      {m.upcoming > 0 ? (
        <div className="tabular-nums">
          예정 <span className="font-semibold">{formatCurrency(m.upcoming)}</span>
        </div>
      ) : null}
      {m.actual === 0 && m.upcoming === 0 ? (
        <div className="text-muted-foreground">내역 없음</div>
      ) : null}
    </div>
  );
}

/**
 * 올해 1월부터 12월까지 달마다 실제(단색)를 쌓고 그 위에 남은 예정(빗금)을 얹는 막대.
 * 지난 달은 실제만, 이번 달은 실제 + 남은 예정, 다음 달부터는 예정만 서서
 * "올해 남은 달들이 어떤 모양으로 지나갈지"가 한눈에 보인다.
 */
export function YearProjectionChart({ projection, group, upcomingCount, onUpcomingClick }: Props) {
  const { months, currentMonth } = projection;
  const fill = FILL[group];
  const patternId = `year-hatch-${group}`;
  const config = {
    actual: { label: `실제 ${GROUP_LABEL[group]}`, color: fill },
    upcoming: { label: `예정 ${GROUP_LABEL[group]}`, color: HATCH_FILL[group] },
  } satisfies ChartConfig;

  return (
    <div data-testid="year-projection" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">올해 {GROUP_LABEL[group]} 흐름</span>
        {upcomingCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUpcomingClick}
            data-testid="year-projection-upcoming-button"
            className="h-7 gap-1 px-2 text-xs"
          >
            <span className="h-2.5 w-4 rounded-sm" style={HATCH_STYLE[group]} />
            예정 {upcomingCount}건
            <ChevronRight size={14} />
          </Button>
        ) : null}
      </div>

      <ChartContainer config={config} className="h-[150px] w-full">
        <BarChart
          data={months}
          margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
          barCategoryGap="25%"
        >
          <defs>
            <pattern
              id={patternId}
              patternUnits="userSpaceOnUse"
              width={6}
              height={6}
              patternTransform="rotate(45)"
            >
              <rect width={3} height={6} fill={HATCH_FILL[group]} />
            </pattern>
          </defs>
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tickFormatter={(m) => `${m}월`}
            fontSize={11}
            interval={0}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tickCount={3}
            tickFormatter={(v: number) => (v === 0 ? '0' : `${formatCurrencyMan(v)}`)}
            fontSize={11}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted) / 0.6)' }}
            content={<YearTooltip group={group} />}
          />
          <ReferenceLine
            x={currentMonth}
            stroke="hsl(var(--muted-foreground) / 0.5)"
            strokeDasharray="3 3"
            label={{
              value: '이번 달',
              position: 'insideTopLeft',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
            }}
          />
          <Bar dataKey="actual" stackId="m" fill={fill} isAnimationActive={false}>
            {months.map((m) => (
              <Cell
                key={m.month}
                data-testid={m.actual > 0 ? `year-bar-actual-${m.month}` : undefined}
              />
            ))}
          </Bar>
          <Bar
            dataKey="upcoming"
            stackId="m"
            fill={`url(#${patternId})`}
            stroke={HATCH_FILL[group]}
            strokeWidth={1}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          >
            {months.map((m) => (
              <Cell
                key={m.month}
                data-testid={m.upcoming > 0 ? `year-bar-upcoming-${m.month}` : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
