'use client';

import { GoalsHeroCard } from './GoalsHeroCard';
import { GoalCategoryCard } from './GoalCategoryCard';
import { GOAL_CATEGORIES, type GoalCategoryKey } from '@/constants/goal-categories';
import type { AnnualPlanItem } from '@/types';
import { filterItemsByGroup } from '@/hooks/useAnnualPlan';

type GoalsMainViewProps = {
  items: AnnualPlanItem[];
  /** 카테고리별 현재 달성액 (옵션). 추후 cashbook 실적 연동 시 채움. */
  actuals?: Partial<Record<GoalCategoryKey, number>>;
  onSelectCategory: (key: GoalCategoryKey) => void;
};

export function GoalsMainView({
  items,
  actuals,
  onSelectCategory,
}: GoalsMainViewProps) {
  const totals = GOAL_CATEGORIES.reduce(
    (acc, cat) => {
      const catItems = filterItemsByGroup(items, cat.group);
      acc[cat.key] = {
        goal: catItems.reduce((s, it) => s + it.annualAmount, 0),
        count: catItems.length,
      };
      return acc;
    },
    {} as Record<GoalCategoryKey, { goal: number; count: number }>
  );

  return (
    <div className="space-y-3">
      <GoalsHeroCard
        totalIncome={totals.income.goal}
        totalExpense={totals.expense.goal}
        investmentAllocated={totals.investment.goal}
        flexTotal={totals.flex.goal}
      />

      <div className="pt-2 text-[13px] font-semibold tracking-wide text-stone-500">
        목표 설정
      </div>

      <div className="space-y-3">
        {GOAL_CATEGORIES.map((theme) => (
          <GoalCategoryCard
            key={theme.key}
            theme={theme}
            goal={totals[theme.key].goal}
            actual={actuals?.[theme.key]}
            itemCount={totals[theme.key].count}
            onSelect={() => onSelectCategory(theme.key)}
          />
        ))}
      </div>
    </div>
  );
}
