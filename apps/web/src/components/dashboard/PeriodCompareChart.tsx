'use client';

import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts';
import { BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
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
import type { PeriodComparison } from '@/hooks/useDashboardData';
import type { CategoryGroup } from '@/types';
import { formatCurrency, formatCurrencyMan } from '@/utils/currency';

type Props = {
  comparison: PeriodComparison;
  /** 비교 기간 데이터 로딩 중이면 요약·차트 대신 스켈레톤을 보여준다 */
  isLoading?: boolean;
  group: CategoryGroup;
  /** 현재 기간 라벨 (예: 2026년 10월) */
  currentLabel: string;
  /** 비교 대상 라벨 (예: 2026년 9월, 평소) */
  compareLabel: string;
  /** 비교 대상 보조 라벨 (예: 전월, 6개월 중위값). 직접 고른 달이면 생략. */
  compareHint?: string;
  /**
   * 요약에 쓸 비교 대상 합계. 주지 않으면 막대 금액을 더한다.
   * 평소(중위값)는 묶음 합계의 중위값이라 카테고리별 중위값의 합과 다를 수 있어 따로 받는다.
   */
  compareTotal?: number;
  /** 비교 대상을 쓸 수 없을 때(평소 표본 부족 등) 요약·차트 대신 보여줄 안내 */
  unavailableMessage?: string;
  /** 비교 기간 선택 UI를 연다 */
  onCompareClick: () => void;
  /** 막대 차트에 표시할 카테고리 */
  selectedCategories: string[];
  /**
   * 카테고리를 하나도 고르지 않았을 때 대신 보여줄 총액 막대의 이름 (예: 전체 고정 지출).
   * 주면 선택이 없을 때 전체 합계 1줄로 비교하고, 없으면 카테고리 선택을 안내한다.
   */
  totalRowLabel?: string;
  /** 비교 대상 카테고리 선택 시트를 연다. 없으면 카테고리 선택 영역을 숨긴다(총액 비교 전용). */
  onSelectCategoriesClick?: () => void;
};

// 막대 라벨: 만원 단위로 반올림해 읽기 쉽게 (예: 1,700,000 → 170만원, 281,000 → 28만원, 5,000 → 5,000원)
function formatBarLabel(n: number): string {
  return `${formatCurrencyMan(n)}원`;
}

// 현재 기간 막대 색: 그룹 시맨틱 색. 비교 기간은 회색으로 눌러 현재 기간이 먼저 읽히게 한다.
const CURRENT_COLOR: Record<CategoryGroup, string> = {
  expense: 'hsl(var(--expense))',
  income: 'hsl(var(--income))',
};
const COMPARE_COLOR = 'hsl(var(--muted-foreground) / 0.35)';

// 증가가 좋은 그룹(수입)과 나쁜 그룹(지출)을 나눠 증감 색을 정한다.
const INCREASE_IS_GOOD: Record<CategoryGroup, boolean> = {
  expense: false,
  income: true,
};

const ROW_HEIGHT = 52;
// '전체 고정 지출'(8자)처럼 총액 막대 이름이 잘리지 않을 만큼
const MAX_LABEL_CHARS = 8;

function truncateLabel(label: string): string {
  return label.length > MAX_LABEL_CHARS ? `${label.slice(0, MAX_LABEL_CHARS - 1)}…` : label;
}

function DeltaSummary({
  current,
  compare,
  group,
  compareLabel,
}: {
  current: number;
  compare: number;
  group: CategoryGroup;
  compareLabel: string;
}) {
  const delta = current - compare;
  if (delta === 0) {
    return <span className="text-muted-foreground">{compareLabel} 대비 변동 없음</span>;
  }
  const good = delta > 0 === INCREASE_IS_GOOD[group];
  const rate = compare !== 0 ? Math.round((delta / Math.abs(compare)) * 100) : null;
  return (
    <>
      {/* 좋은 변화(지출 감소·수입 증가)는 😎, 나쁜 변화는 🚨 */}
      <span data-testid="compare-delta-emoji">{good ? '😎' : '🚨'} </span>
      <span className="text-muted-foreground">{compareLabel} 대비 </span>
      <span className={cn('font-extrabold tabular-nums', good ? 'text-income' : 'text-expense')}>
        {delta > 0 ? '▲' : '▼'} {formatCurrency(Math.abs(delta))}
        {rate !== null ? ` (${Math.abs(rate)}%)` : ''}
      </span>
    </>
  );
}

export function PeriodCompareChart({
  comparison,
  isLoading = false,
  group,
  currentLabel,
  compareLabel,
  compareHint,
  compareTotal: compareTotalOverride,
  unavailableMessage,
  onCompareClick,
  selectedCategories,
  totalRowLabel,
  onSelectCategoriesClick,
}: Props) {
  // 선택한 카테고리만 막대로 비교한다 (rows 정렬 순서 유지)
  const selectedRows = comparison.rows.filter((r) => selectedCategories.includes(r.category));
  // 선택이 없고 총액 막대 이름이 있으면 전체 합계 1줄로 비교한다
  const isTotalMode =
    totalRowLabel !== undefined && selectedRows.length === 0 && comparison.rows.length > 0;
  const rows = isTotalMode
    ? [
        {
          category: totalRowLabel,
          current: comparison.rows.reduce((sum, r) => sum + r.current, 0),
          compare: compareTotalOverride ?? comparison.rows.reduce((sum, r) => sum + r.compare, 0),
        },
      ]
    : selectedRows;
  // 요약 합계·증감도 선택한 카테고리 기준으로 막대와 맞춘다
  const currentTotal = rows.reduce((sum, r) => sum + r.current, 0);
  const compareTotal = compareTotalOverride ?? rows.reduce((sum, r) => sum + r.compare, 0);

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
      ) : unavailableMessage ? (
        <p data-testid="compare-unavailable" className="text-xs text-muted-foreground">
          {unavailableMessage}
        </p>
      ) : (
        <>
          {rows.length > 0 ? (
            <>
              {isTotalMode ? null : (
                <div
                  className="text-[11px] text-muted-foreground"
                  data-testid="compare-summary-caption"
                >
                  선택한 카테고리 {rows.length}개 합계
                </div>
              )}
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
                    {formatCurrency(currentTotal)}
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
                    {formatCurrency(compareTotal)}
                  </div>
                </div>
              </div>
              <div
                data-testid="compare-delta"
                className="rounded-lg bg-muted/50 px-3 py-2 text-sm font-semibold"
              >
                <DeltaSummary
                  current={currentTotal}
                  compare={compareTotal}
                  group={group}
                  compareLabel={compareLabel}
                />
              </div>
            </>
          ) : null}

          {onSelectCategoriesClick && comparison.rows.length > 0 ? (
            <div
              data-testid="compare-category-section"
              className="flex items-center justify-between"
            >
              {isTotalMode ? null : (
                <span className="text-xs text-muted-foreground">
                  비교할 카테고리 {rows.length}개
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectCategoriesClick}
                data-testid="compare-category-button"
                className="ml-auto h-7 gap-0.5 px-2 text-xs"
              >
                카테고리 선택
                <ChevronRight size={14} />
              </Button>
            </div>
          ) : null}

          {comparison.rows.length === 0 ? (
            <div data-testid="trend-chart">
              <EmptyState
                icon={<BarChart3 size={32} />}
                title="비교할 내역이 없어요"
                description="두 기간 모두 내역이 없어요. 다른 비교 기간을 선택해보세요"
              />
            </div>
          ) : rows.length === 0 ? (
            <div data-testid="trend-chart">
              <EmptyState
                icon={<BarChart3 size={32} />}
                title="비교할 카테고리를 선택해주세요"
                description="'카테고리 선택'에서 비교할 카테고리를 골라보세요"
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
                margin={{ left: 0, right: 64, top: 4, bottom: 4 }}
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
                    formatter={(label) => formatBarLabel(Number(label) || 0)}
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
                    formatter={(label) => formatBarLabel(Number(label) || 0)}
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
