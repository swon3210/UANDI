'use client';

import { useId, useMemo } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';
import dayjs from 'dayjs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@uandi/ui';
import {
  type ExchangeRatePoint,
  type SupportedCurrency,
  getDisplayRate,
} from '@uandi/investment-core';

type Props = {
  currency: SupportedCurrency;
  points: ExchangeRatePoint[];
};

function ma(points: ExchangeRatePoint[], window: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < points.length; i += 1) {
    if (i < window - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = i - window + 1; j <= i; j += 1) sum += points[j].rate;
    result.push(sum / window);
  }
  return result;
}

const config: ChartConfig = {
  rate: { label: '환율', color: 'hsl(var(--primary))' },
  ma5: { label: 'MA5', color: 'hsl(var(--muted-foreground))' },
  ma20: { label: 'MA20', color: 'hsl(var(--income))' },
};

const TARGET_DOT_COUNT = 12;

type RateDotProps = {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: { showDot?: boolean };
};

function RateDot({ cx, cy, index, payload }: RateDotProps) {
  if (cx === undefined || cy === undefined || !payload?.showDot) {
    return <g key={`dot-${index}`} />;
  }
  return (
    <circle
      key={`dot-${index}`}
      cx={cx}
      cy={cy}
      r={3}
      fill="hsl(var(--primary))"
      stroke="hsl(var(--background))"
      strokeWidth={1.5}
    />
  );
}

export function ExchangeRateChart({ currency, points }: Props) {
  const gradientId = useId();
  const data = useMemo(() => {
    const ma5 = ma(points, 5);
    const ma20 = ma(points, 20);
    const dotInterval = Math.max(1, Math.floor(points.length / TARGET_DOT_COUNT));
    const lastIndex = points.length - 1;
    return points.map((p, i) => {
      const displayRate = getDisplayRate(p.rate, currency);
      return {
        date: p.date,
        label: dayjs(p.date).format('MM/DD'),
        rate: displayRate,
        rateArea: displayRate,
        ma5: ma5[i] !== null ? getDisplayRate(ma5[i] as number, currency) : null,
        ma20: ma20[i] !== null ? getDisplayRate(ma20[i] as number, currency) : null,
        showDot: i === 0 || i === lastIndex || i % dotInterval === 0,
      };
    });
  }, [points, currency]);

  return (
    <ChartContainer
      config={config}
      data-testid="exchange-rate-chart"
      className="aspect-[16/9] w-full"
    >
      <ComposedChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 4" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={40}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={56}
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => v.toFixed(0)}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
        />
        <ChartTooltip
          cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value, name) => (
                <span className="font-mono tabular-nums">
                  {String(name)}{' '}
                  {typeof value === 'number' ? value.toFixed(2) : value}원
                </span>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="rateArea"
          stroke="none"
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
          legendType="none"
          tooltipType="none"
        />
        <Line
          key="ma20-line"
          type="monotone"
          dataKey="ma20"
          stroke="hsl(var(--income))"
          strokeWidth={1.25}
          strokeDasharray="4 4"
          dot={false}
          isAnimationActive={false}
        />
        <Line
          key="ma5-line"
          type="monotone"
          dataKey="ma5"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1}
          strokeDasharray="2 3"
          strokeOpacity={0.7}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          key="rate-line"
          type="monotone"
          dataKey="rate"
          stroke="hsl(var(--primary))"
          strokeWidth={2.25}
          strokeLinecap="round"
          dot={<RateDot />}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
