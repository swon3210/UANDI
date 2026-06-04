'use client';

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../components/chart';

export type DailyCumulativePoint = {
  day: number; // 1~31
  cumulative: number | null; // 누적 실제 지출 (오늘 이후 날짜는 null → 라인이 오늘에서 멈춤)
};

export type DailyCumulativeChartProps = {
  data: DailyCumulativePoint[];
  /** 이번 달 지출 예산 = 가로 "천장"선. 0 이하이면 천장선을 그리지 않는다. */
  budgetCeiling: number;
  className?: string;
};

// 색은 hex 리터럴로 고정 — PNG/PDF 캡처 시 색 누락 방지
const CHART_CONFIG = {
  cumulative: { label: '누적 지출', color: '#e8837a' },
} satisfies ChartConfig;

function formatCompactKrw(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  return String(n);
}

export function DailyCumulativeChart({ data, budgetCeiling, className }: DailyCumulativeChartProps) {
  const hasCeiling = budgetCeiling > 0;

  return (
    <ChartContainer
      config={CHART_CONFIG}
      data-testid="daily-cumulative-chart"
      className={className ?? 'aspect-[16/10] w-full'}
    >
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(d) => `${d}일`}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={48}
          tickFormatter={formatCompactKrw}
          domain={[0, (dataMax: number) => Math.max(budgetCeiling, dataMax) * 1.05]}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `${label}일`}
              formatter={(value) => (
                <span className="font-mono tabular-nums">
                  누적 지출 {typeof value === 'number' ? value.toLocaleString() : value}원
                </span>
              )}
            />
          }
        />
        {hasCeiling && (
          <ReferenceLine
            y={budgetCeiling}
            stroke="#94a3b8"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: `예산 ${formatCompactKrw(budgetCeiling)}`,
              position: 'insideTopRight',
              fill: '#64748b',
              fontSize: 11,
            }}
          />
        )}
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke={CHART_CONFIG.cumulative.color}
          fill={CHART_CONFIG.cumulative.color}
          fillOpacity={0.2}
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
