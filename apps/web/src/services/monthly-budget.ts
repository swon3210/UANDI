import { getAnnualPlan, getPlanItems } from '@/services/annual-plan';
import type { MonthlyBudgetItem } from '@/types';

export type ComputedMonthlyBudget = {
  year: number;
  month: number; // 1~12
  items: MonthlyBudgetItem[];
};

export async function getComputedMonthlyBudget(
  coupleId: string,
  year: number,
  month: number // 1~12
): Promise<ComputedMonthlyBudget | null> {
  const plan = await getAnnualPlan(coupleId, year);
  if (!plan) return null;

  const items = await getPlanItems(coupleId, plan.id);
  const budgetItems: MonthlyBudgetItem[] = [];

  for (const item of items) {
    const monthIdx = month - 1;
    const budgetAmount = item.monthlyAmounts?.[monthIdx] ?? 0;
    budgetItems.push({
      categoryId: item.categoryId,
      group: item.group,
      subGroup: item.subGroup,
      budgetAmount,
      ownerUid: item.ownerUid,
    });
  }

  return { year, month, items: budgetItems };
}
