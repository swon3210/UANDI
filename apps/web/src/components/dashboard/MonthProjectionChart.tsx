'use client';

import { Line, LineChart, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronRight } from 'lucide-react';
import { Button, ChartContainer, type ChartConfig } from '@uandi/ui';
import type { CategoryGroup } from '@/types';
import { formatCurrency, formatCurrencyMan } from '@/utils/currency';
import type { MonthProjection, MonthProjectionPoint } from '@/utils/upcoming-fixed';
import { HATCH_STYLE } from './ActualProjectedBar';

type Props = {
  projection: MonthProjection;
  group: CategoryGroup;
  /** 남은 예정 건수. 0이면 예정 칩 대신 "예정 없음"으로 */
  upcomingCount: number;
  /** 발생일이 지났는데 아직 기록하지 않은 건수 */
  overdueCount: number;
  /** 예정 칩 클릭 → 항목 목록 시트 */
  onUpcomingClick: () => void;
};

const STROKE: Record<CategoryGroup, string> = {
  expense: 'hsl(var(--expense))',
  income: 'hsl(var(--income))',
};

const GROUP_LABEL: Record<CategoryGroup, string> = {
  expense: '지출',
  income: '수입',
};

/** 예정 발생일에만 점을 찍는다 (점선 위에 흰 속 + 계열 색 테두리) */
function ProjectedDot(props: {
  cx?: number;
  cy?: number;
  payload?: MonthProjectionPoint;
  stroke?: string;
}) {
  const { cx, cy, payload, stroke } = props;
  if (cx == null || cy == null || !payload || payload.items.length === 0) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="hsl(var(--card))"
      stroke={stroke}
      strokeWidth={2}
      data-testid={`projection-dot-${payload.day}`}
    />
  );
}

function ProjectionTooltip({
  active,
  payload,
  group,
}: {
  active?: boolean;
  payload?: Array<{ payload: MonthProjectionPoint }>;
  group: CategoryGroup;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const isProjected = point.actual === null;
  const amount = isProjected ? point.projected : point.actual;
  return (
    <div className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-md">
      <div className="text-muted-foreground">
        {point.day}일 · {isProjected ? '예상 누적' : '실제 누적'} {GROUP_LABEL[group]}
      </div>
      <div className="font-semibold tabular-nums">{formatCurrency(amount ?? 0)}</div>
      {point.items.length > 0 ? (
        <div className="mt-0.5 text-muted-foreground">예정: {point.items.join(', ')}</div>
      ) : null}
    </div>
  );
}

/** 점선 끝(말일)에 붙는 월말 예상 라벨. 오른쪽 끝에서 왼쪽으로 정렬해 차트 밖으로 나가지 않게 한다 */
function EndLabel(props: {
  viewBox?: { cx?: number; cy?: number; x?: number; y?: number };
  text: string;
  fill: string;
}) {
  const vb = props.viewBox ?? {};
  const x = vb.cx ?? vb.x;
  const y = vb.cy ?? vb.y;
  if (x == null || y == null) return null;
  return (
    <text
      x={x}
      y={y - 8}
      textAnchor="end"
      fontSize={11}
      fontWeight={600}
      fill={props.fill}
      data-testid="projection-end-label"
    >
      {props.text}
    </text>
  );
}

function xTicks(daysInMonth: number, today: number): number[] {
  const base = [1, 10, 20, daysInMonth];
  if (!base.includes(today)) base.push(today);
  return [...new Set(base)].sort((a, b) => a - b);
}

/**
 * 이달 1일부터 말일까지의 누적 흐름. 오늘까지는 실선, 오늘부터는 예정 고정 항목을 더한 점선이
 * 결제일마다 계단처럼 올라가 "이대로 가면 월말에 얼마"가 한눈에 보이게 한다.
 */
export function MonthProjectionChart({
  projection,
  group,
  upcomingCount,
  overdueCount,
  onUpcomingClick,
}: Props) {
  const { points, today, daysInMonth, projectedTotal } = projection;
  const stroke = STROKE[group];
  const config = {
    actual: { label: `실제 누적 ${GROUP_LABEL[group]}`, color: stroke },
    projected: { label: `예상 누적 ${GROUP_LABEL[group]}`, color: stroke },
  } satisfies ChartConfig;
  const hasUpcoming = upcomingCount > 0;

  return (
    <div data-testid="month-projection" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">이달 {GROUP_LABEL[group]} 흐름</span>
        {hasUpcoming || overdueCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUpcomingClick}
            data-testid="projection-upcoming-button"
            className="h-7 gap-1 px-2 text-xs"
          >
            {hasUpcoming ? (
              <>
                <span className="h-2.5 w-4 rounded-sm" style={HATCH_STYLE[group]} />
                예정 {upcomingCount}건
              </>
            ) : null}
            {overdueCount > 0 ? (
              <span data-testid="projection-overdue-hint">
                {hasUpcoming ? ' · ' : '⏰ '}미기록 {overdueCount}건
              </span>
            ) : null}
            <ChevronRight size={14} />
          </Button>
        ) : null}
      </div>

      <ChartContainer config={config} className="h-[150px] w-full">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="day"
            ticks={xTicks(daysInMonth, today)}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tickFormatter={(d) => `${d}일`}
            fontSize={11}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            tickCount={3}
            tickFormatter={(v: number) => (v === 0 ? '0' : `${formatCurrencyMan(v)}`)}
            fontSize={11}
            domain={[0, (dataMax: number) => Math.max(dataMax, 1) * 1.1]}
          />
          <Tooltip
            cursor={{ stroke: 'hsl(var(--border))' }}
            content={<ProjectionTooltip group={group} />}
          />
          <ReferenceLine
            x={today}
            stroke="hsl(var(--muted-foreground) / 0.5)"
            strokeDasharray="3 3"
            label={{
              value: '오늘',
              position: 'insideTopLeft',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke={stroke}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="stepAfter"
            dataKey="projected"
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={<ProjectedDot stroke={stroke} />}
            activeDot={{ r: 4 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          {hasUpcoming ? (
            <ReferenceDot
              x={daysInMonth}
              y={projectedTotal}
              r={0}
              ifOverflow="visible"
              label={<EndLabel text={`월말 ${formatCurrencyMan(projectedTotal)}`} fill={stroke} />}
            />
          ) : null}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
