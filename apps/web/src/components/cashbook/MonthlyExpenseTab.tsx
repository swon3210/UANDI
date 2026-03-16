'use client';

import { Separator } from '@uandi/ui';
import { CategoryBudgetRow } from './CategoryBudgetRow';
import { WeeklyExpenseTable } from './WeeklyExpenseTable';
import type { CategoryBudgetSummary, WeeklyExpense } from '@/hooks/useMonthlyBudget';

type MonthlyExpenseTabProps = {
  categoryBudgets: CategoryBudgetSummary[];
  weeklyExpenses: WeeklyExpense[];
};

export function MonthlyExpenseTab({
  categoryBudgets,
  weeklyExpenses,
}: MonthlyExpenseTabProps) {
  return (
    <div className="space-y-6">
      {/* 카테고리별 지출 */}
      <section>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">카테고리별 지출</h4>
        <div className="rounded-xl border border-border px-3">
          {categoryBudgets.length > 0 ? (
            categoryBudgets.map((budget) => (
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
