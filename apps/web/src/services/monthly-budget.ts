import { getAnnualPlan, getPlanItems } from '@/services/annual-plan';
import type { AnnualPlanItem, MonthlyBudgetItem } from '@/types';

export type ComputedMonthlyBudget = {
  year: number;
  month: number; // 1~12
  items: MonthlyBudgetItem[];
};

/**
 * 연간 계획에서 해당 월의 예산을 on-the-fly로 계산한다.
 * Firestore에 별도 저장하지 않고, 연간 계획 아이템을 기반으로 분배.
 *
 * 분배 로직:
 * - monthlyAmount가 있으면 → 그대로 사용
 * - targetMonths가 있으면 → 해당 월에만 배정 (annualAmount ÷ targetMonths.length)
 * - 둘 다 없으면 → annualAmount ÷ 12
 */
function computeMonthlyBudgetItem(
  item: AnnualPlanItem,
  month: number
): MonthlyBudgetItem | null {
  let budgetAmount: number;

  if (item.monthlyAmount != null) {
    budgetAmount = item.monthlyAmount;
  } else if (item.targetMonths && item.targetMonths.length > 0) {
    if (!item.targetMonths.includes(month)) return null;
    budgetAmount = Math.round(item.annualAmount / item.targetMonths.length);
  } else {
    budgetAmount = Math.round(item.annualAmount / 12);
  }

  return {
    categoryId: item.categoryId,
    group: item.group,
    subGroup: item.subGroup,
    budgetAmount,
    ownerUid: item.ownerUid,
  };
}

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
    const budgetItem = computeMonthlyBudgetItem(item, month);
    if (budgetItem) budgetItems.push(budgetItem);
  }

  return { year, month, items: budgetItems };
}
