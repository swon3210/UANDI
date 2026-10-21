'use client';

import { cn } from '@uandi/ui';
import type { CategoryGroup } from '@/types';
import { formatCurrency } from '@/utils/currency';

type Props = {
  category: string;
  group: CategoryGroup;
  /** 기준 달 라벨 (예: 2026년 10월) */
  monthLabel: string;
  /** 고정/변동 세부 필터 라벨 (예: 변동 지출). 없으면 그룹 이름만 */
  scopeLabel?: string;
  currentAmount: number;
  /** 평소(중위값). 표본 부족이면 null → `—` */
  median: number | null;
  /** 평소 계산에 들어간 달 수 */
  sampleMonths: number;
  windowMonths: number;
};

const GROUP_LABEL: Record<CategoryGroup, string> = { expense: '지출', income: '수입' };
const GROUP_TONE: Record<CategoryGroup, string> = {
  expense: 'text-expense',
  income: 'text-income',
};

/** 카테고리 분석 페이지 상단: 이름·기준 달 + 이번 달/평소 두 칸 */
export function CategoryAnalysisSummary({
  category,
  group,
  monthLabel,
  scopeLabel,
  currentAmount,
  median,
  sampleMonths,
  windowMonths,
}: Props) {
  return (
    <section data-testid="category-analysis-summary" className="space-y-3">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <h2 data-testid="category-analysis-title" className="truncate text-xl font-semibold">
            {category}
          </h2>
          <span className="shrink-0 text-xs text-muted-foreground">
            {scopeLabel ?? GROUP_LABEL[group]}
          </span>
        </div>
        <p data-testid="category-analysis-month" className="mt-0.5 text-xs text-muted-foreground">
          {monthLabel} 기준
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="text-[11px] text-muted-foreground">이번 달</dt>
          <dd
            data-testid="category-analysis-current"
            className={cn('mt-0.5 text-lg font-semibold tabular-nums', GROUP_TONE[group])}
          >
            {formatCurrency(currentAmount)}
          </dd>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="text-[11px] text-muted-foreground">
            평소 (중위값)
            {median !== null ? ` · ${sampleMonths}개월` : ''}
          </dt>
          <dd
            data-testid="category-analysis-median"
            className="mt-0.5 text-lg font-semibold tabular-nums"
          >
            {median !== null ? formatCurrency(median) : '—'}
          </dd>
        </div>
      </dl>
      {median === null ? (
        <p className="text-[11px] text-muted-foreground">
          지난 {windowMonths}개월 중 기록이 2개월 이상 쌓이면 평소 금액이 보여요
        </p>
      ) : null}
    </section>
  );
}
