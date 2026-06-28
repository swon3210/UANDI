'use client';

import { useState } from 'react';
import {
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uandi/ui';
import { CategoryBudgetRow } from './CategoryBudgetRow';
import { WeeklyExpenseTable } from './WeeklyExpenseTable';
import type { CategoryBudgetSummary, WeeklyExpense } from '@/hooks/useMonthlyBudget';

export type CategorySort = 'default' | 'over';

type MonthlyExpenseTabProps = {
  categoryBudgets: CategoryBudgetSummary[];
  weeklyExpenses: WeeklyExpense[];
  /** 진입 시 초기 정렬. 예산 알림 "자세히 보기"로 오면 'over'. */
  initialSort?: CategorySort;
};

// 초과 정도 = 실제/예산 비율. 예산이 0인데 지출이 있으면 가장 위로.
function overRatio(b: CategoryBudgetSummary): number {
  if (b.budgetAmount <= 0) return b.actualAmount > 0 ? Number.POSITIVE_INFINITY : 0;
  return b.actualAmount / b.budgetAmount;
}

function sortCategories(
  list: CategoryBudgetSummary[],
  sort: CategorySort
): CategoryBudgetSummary[] {
  if (sort !== 'over') return list;
  // 초과율이 높은 순 → 예산을 넘긴 카테고리가 맨 위로 모인다.
  return [...list].sort((a, b) => overRatio(b) - overRatio(a));
}

export function MonthlyExpenseTab({
  categoryBudgets,
  weeklyExpenses,
  initialSort = 'default',
}: MonthlyExpenseTabProps) {
  const [sort, setSort] = useState<CategorySort>(initialSort);
  const sortedCategories = sortCategories(categoryBudgets, sort);

  return (
    <div className="space-y-6">
      {/* 카테고리별 지출 */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-muted-foreground">카테고리별 지출</h4>
          {categoryBudgets.length > 1 && (
            <Select value={sort} onValueChange={(v) => setSort(v as CategorySort)}>
              <SelectTrigger
                className="h-8 w-[104px]"
                aria-label="카테고리 정렬"
                data-testid="category-sort-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">기본순</SelectItem>
                <SelectItem value="over">초과순</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="rounded-xl bg-card border border-border px-3">
          {sortedCategories.length > 0 ? (
            sortedCategories.map((budget) => (
              <CategoryBudgetRow
                key={budget.categoryId}
                categoryName={budget.categoryName}
                icon={budget.icon}
                budgetAmount={budget.budgetAmount}
                actualAmount={budget.actualAmount}
                percentage={budget.percentage}
                status={budget.status}
                margin={budget.margin}
              />
            ))
          ) : (
            <p className="py-4 text-sm text-muted-foreground text-center">
              지출 예산이 설정되지 않았어요
            </p>
          )}
        </div>
      </section>

      <Separator />

      {/* 주별 지출 추이 */}
      <section>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">주별 지출 추이</h4>
        {weeklyExpenses.length > 0 ? (
          <WeeklyExpenseTable weeks={weeklyExpenses} />
        ) : (
          <p className="py-4 text-sm text-muted-foreground text-center">
            변동 지출 예산이 설정되지 않았어요
          </p>
        )}
      </section>
    </div>
  );
}
