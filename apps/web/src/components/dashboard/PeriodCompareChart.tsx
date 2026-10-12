'use client';

import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts';
import { BarChart3, ChevronDown } from 'lucide-react';
import {
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  EmptyState,
  Skeleton,
  cn,
  type ChartConfig,
} from '@uandi/ui';
import type { GroupFilter, PeriodComparison } from '@/hooks/useDashboardData';
import { formatCurrency } from '@/utils/currency';

type Props = {
  comparison: PeriodComparison;
  /** 비교 기간 데이터 로딩 중이면 요약·차트 대신 스켈레톤을 보여준다 */
  isLoading?: boolean;
  group: GroupFilter;
  /** 현재 기간 라벨 (예: 2026년 10월) */
  currentLabel: string;
  /** 비교 기간 라벨 (예: 2026년 9월) */
  compareLabel: string;
  /** 비교 기간이 기본값(직전 기간)일 때 붙일 보조 라벨 (예: 전월). 직접 고른 경우 생략. */
  compareHint?: string;
  /** 비교 기간 선택 UI를 연다 */
  onCompareClick: () => void;
};

function formatCompact(n: number): string {
  if (n >= 10_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// 현재 기간 막대 색: 그룹 시맨틱 색. 비교 기간은 회색으로 눌러 현재 기간이 먼저 읽히게 한다.
const CURRENT_COLOR: Record<GroupFilter, string> = {
  all: 'hsl(var(--primary))',
  expense: 'hsl(var(--expense))',
  income: 'hsl(var(--income))',
  flex: 'hsl(var(--primary))',
};
const COMPARE_COLOR = 'hsl(var(--muted-foreground) / 0.35)';

// 증가가 좋은 그룹(수입·순잔액)과 나쁜 그룹(지출·FLEX)을 나눠 증감 색을 정한다.
const INCREASE_IS_GOOD: Record<GroupFilter, boolean> = {
  all: true,
  expense: false,
  income: true,
  flex: false,
};

const ROW_HEIGHT = 52;
const MAX_LABEL_CHARS = 7;

function truncateLabel(label: string): string {
  return label.length > MAX_LABEL_CHARS ? `${label.slice(0, MAX_LABEL_CHARS - 1)}…` : label;
}

function DeltaText({
  current,
  compare,
  group,
}: {
  current: number;
  compare: number;
  group: GroupFilter;
}) {
  const delta = current - compare;
  if (delta === 0) {
    return <span className="text-muted-foreground">변동 없음</span>;
  }
  const good = delta > 0 === INCREASE_IS_GOOD[group];
  const rate = compare !== 0 ? Math.round((delta / Math.abs(compare)) * 100) : null;
  return (
    <span className={cn('tabular-nums', good ? 'text-income' : 'text-expense')}>
      {delta > 0 ? '▲' : '▼'} {formatCurrency(Math.abs(delta))}
      {rate !== null ? ` (${Math.abs(rate)}%)` : ''}
    </span>
  );
}

export function PeriodCompareChart({
  comparison,
  isLoading = false,
  group,
  currentLabel,
  compareLabel,
  compareHint,
  onCompareClick,
}: Props) {
  const { currentTotal, compareTotal, rows } = comparison;
  // 순잔액은 부호가 의미 있으므로 그대로, 나머지는 금액 크기로 표기한다.
  const display = (n: number) => formatCurrency(group === 'all' ? n : Math.abs(n));

  const config: ChartConfig = {
    current: { label: currentLabel, color: CURRENT_COLOR[group] },
    compare: { label: compareLabel, color: COMPARE_COLOR },
  };

  const chartHeight = rows.length * ROW_HEIGHT + 16;
  const longestLabel = Math.min(
    Math.max(0, ...rows.map((r) => r.category.length)),
    MAX_LABEL_CHARS
  );
  const yAxisWidth = Math.max(longestLabel * 12 + 12, 56);

  return (
    <div data-testid="period-compare" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">기간 비교</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onCompareClick}
          data-testid="compare-period-button"
          aria-label={`비교 기간 ${compareLabel}, 비교 기간 선택`}
          className="h-7 gap-1 px-2 text-xs"
        >
          <span data-testid="compare-period-label">{compareLabel}</span>
          {compareHint ? <span className="text-muted-foreground">({compareHint})</span> : null}
          <ChevronDown size={14} />
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-[160px] w-full rounded-lg" />
      ) : (
        <>
          <div data-testid="compare-summary" className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CURRENT_COLOR[group] }}
                />
                <span className="truncate">{currentLabel}</span>
              </div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">
                {display(currentTotal)}
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: COMPARE_COLOR }}
                />
                <span className="truncate">{compareLabel}</span>
              </div>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">
                {display(compareTotal)}
              </div>
            </div>
          </div>
          <div data-testid="compare-delta" className="text-xs">
            <span className="text-muted-foreground">{compareLabel} 대비 </span>
            <DeltaText current={currentTotal} compare={compareTotal} group={group} />
          </div>

          {rows.length === 0 ? (
            <div data-testid="trend-chart">
              <EmptyState
                icon={<BarChart3 size={32} />}
                title="비교할 내역이 없어요"
                description="두 기간 모두 내역이 없어요. 다른 비교 기간을 선택해보세요"
              />
            </div>
          ) : (
            <ChartContainer
              config={config}
              data-testid="trend-chart"
              className="aspect-auto w-full"
              style={{ height: chartHeight }}
            >
              <BarChart
                data={rows}
                layout="vertical"
                barGap={2}
                margin={{ left: 0, right: 48, top: 4, bottom: 4 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={yAxisWidth}
                  tickFormatter={truncateLabel}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <span className="font-mono tabular-nums">
                          {config[String(name)]?.label}{' '}
                          {typeof value === 'number' ? Math.round(value).toLocaleString() : value}원
                        </span>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="current"
                  fill="var(--color-current)"
                  radius={[0, 4, 4, 0]}
                  barSize={14}
                >
                  <LabelList
                    dataKey="current"
                    position="right"
                    offset={6}
                    className="fill-foreground"
                    fontSize={10}
                    formatter={(label) => formatCompact(Number(label) || 0)}
                  />
                </Bar>
                <Bar
                  dataKey="compare"
                  fill="var(--color-compare)"
                  radius={[0, 4, 4, 0]}
                  barSize={14}
                >
                  <LabelList
                    dataKey="compare"
                    position="right"
                    offset={6}
                    className="fill-muted-foreground"
                    fontSize={10}
                    formatter={(label) => formatCompact(Number(label) || 0)}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </>
      )}
    </div>
  );
}
