import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getComputedMonthlyBudget } from '@/services/monthly-budget';
import type {
  CashbookEntry,
  CashbookCategory,
  CategoryGroup,
  MonthlyBudgetItem,
} from '@/types';

const QUERY_KEY = 'monthlyBudget';

export function useMonthlyBudget(
  coupleId: string | null,
  year: number,
  month: number // 1~12
) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId, year, month],
    queryFn: () => getComputedMonthlyBudget(coupleId!, year, month),
    enabled: !!coupleId,
  });
}

// ── 파생 데이터 ──

export type BudgetStatus = 'stable' | 'warning' | 'danger';

export function getBudgetStatus(budget: number, actual: number): BudgetStatus {
  const margin = budget - actual;
  // 예산을 실제로 넘긴 경우(margin < 0)만 긴급. 딱 맞춘 0원 초과는 긴급이 아니다.
  if (margin < 0) return 'danger';
  if (margin < budget * 0.2) return 'warning';
  return 'stable';
}

// 알림 임계값: safe(<80%) / warn80(80~99%) / over100(100~119%) / over120(120%~)
export type BudgetThreshold = 'safe' | 'warn80' | 'over100' | 'over120';

export function getBudgetThreshold(budget: number, actual: number): BudgetThreshold {
  if (budget <= 0) return 'safe';
  const ratio = actual / budget;
  if (ratio >= 1.2) return 'over120';
  if (ratio >= 1.0) return 'over100';
  if (ratio >= 0.8) return 'warn80';
  return 'safe';
}

export type CategoryBudgetSummary = {
  categoryId: string;
  categoryName: string;
  icon: string;
  budgetAmount: number;
  actualAmount: number;
  percentage: number;
  status: BudgetStatus;
  margin: number;
};

// 기본은 지출 그룹만 — 참조 안정성을 위해 모듈 상수로 둔다(useMemo 의존성 안정).
const DEFAULT_SUMMARY_GROUPS: CategoryGroup[] = ['expense'];

export function useCategoryBudgetSummaries(
  budgetItems: MonthlyBudgetItem[] | undefined,
  entries: CashbookEntry[] | undefined,
  categories: CashbookCategory[] | undefined,
  /** 집계 대상 그룹. */
  groups: CategoryGroup[] = DEFAULT_SUMMARY_GROUPS
): CategoryBudgetSummary[] {
  return useMemo(() => {
    if (!budgetItems || !entries || !categories) return [];

    const targetBudgets = budgetItems.filter((b) => groups.includes(b.group));

    // categoryId → 실제 지출 합산
    const actualByCategoryId = new Map<string, number>();
    for (const entry of entries) {
      if (!groups.includes(entry.type as CategoryGroup)) continue;
      // entry.category는 카테고리 이름 — categoryId로 매핑
      const cat = categories.find((c) => c.name === entry.category);
      if (!cat) continue;
      actualByCategoryId.set(cat.id, (actualByCategoryId.get(cat.id) ?? 0) + entry.amount);
    }

    return targetBudgets.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const actualAmount = actualByCategoryId.get(b.categoryId) ?? 0;
      const percentage = b.budgetAmount > 0 ? Math.round((actualAmount / b.budgetAmount) * 100) : 0;

      return {
        categoryId: b.categoryId,
        categoryName: cat?.name ?? '기타',
        icon: cat?.icon ?? 'question',
        budgetAmount: b.budgetAmount,
        actualAmount,
        percentage: Math.min(percentage, 100),
        status: getBudgetStatus(b.budgetAmount, actualAmount),
        margin: b.budgetAmount - actualAmount,
      };
    });
  }, [budgetItems, entries, categories, groups]);
}
