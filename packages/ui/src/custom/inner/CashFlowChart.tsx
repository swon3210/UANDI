'use client';

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../components/chart';

export type CashFlowPoint = {
  /** 1~12. X축 'M월' 라벨용 */
  month: number;
  /** 과거(완료) + 현재 달의 순현금흐름(수입-지출). 미래 달은 null → 실선이 현재에서 멈춤. */
  actual: number | null;
  /** 현재 + 미래 달의 예측 순현금흐름. 과거 완료 달은 null → 점선이 현재부터 시작. */
  forecast: number | null;
};

export type CashFlowChartProps = {
  data: CashFlowPoint[];
  className?: string;
};

// 색은 hex 리터럴로 고정 — PNG/PDF 캡처 시 색 누락 방지
const CHART_CONFIG = {
  actual: { label: '실제', color: '#4CAF86' },
  forecast: { label: '예측', color: '#94a3b8' },
} satisfies ChartConfig;

// 순현금흐름은 음수가 될 수 있어 부호를 보존한다.
function formatCompactKrw(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000)}만`;
  return `${sign}${abs}`;
}

export function CashFlowChart({ data, className }: CashFlowChartProps) {
  return (
    <ChartContainer
      config={CHART_CONFIG}
      data-testid="cashflow-chart"
      className={className ?? 'aspect-[16/10] w-full'}
    >
      <LineChart data={data} margin={{ left: 8, right: 12, top: 12, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(m) => `${m}월`}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={48}
          tickFormatter={formatCompactKrw}
        />
        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `${label}월`}
              formatter={(value, name) => {
                if (typeof value !== 'number') return null;
                const label = name === 'forecast' ? '예측' : '실제';
                return (
                  <span className="font-mono tabular-nums">
                    {label} {value.toLocaleString()}원
                  </span>
                );
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="actual"
          type="monotone"
          stroke={CHART_CONFIG.actual.color}
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
        <Line
          dataKey="forecast"
          type="monotone"
          stroke={CHART_CONFIG.forecast.color}
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
