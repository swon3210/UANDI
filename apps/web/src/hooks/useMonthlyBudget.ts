import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getComputedMonthlyBudget } from '@/services/monthly-budget';
import type { CashbookEntry, CashbookCategory, MonthlyBudgetItem } from '@/types';

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
  if (margin <= 0) return 'danger';
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

export function getStatusColor(status: BudgetStatus): string {
  switch (status) {
    case 'stable':
      return 'text-income';
    case 'warning':
      return 'text-warning';
    case 'danger':
      return 'text-expense';
  }
}

export function getStatusLabel(status: BudgetStatus): string {
  switch (status) {
    case 'stable':
      return '안정';
    case 'warning':
      return '경고';
    case 'danger':
      return '긴급';
  }
}

export function getStatusEmoji(status: BudgetStatus): string {
  switch (status) {
    case 'stable':
      return '🟢';
    case 'warning':
      return '🟡';
    case 'danger':
      return '🔴';
  }
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

export function useCategoryBudgetSummaries(
  budgetItems: MonthlyBudgetItem[] | undefined,
  entries: CashbookEntry[] | undefined,
  categories: CashbookCategory[] | undefined
): CategoryBudgetSummary[] {
  return useMemo(() => {
    if (!budgetItems || !entries || !categories) return [];

    const expenseBudgets = budgetItems.filter((b) => b.group === 'expense');

    // categoryId → 실제 지출 합산
    const actualByCategoryId = new Map<string, number>();
    for (const entry of entries) {
      if (entry.type !== 'expense') continue;
      // entry.category는 카테고리 이름 — categoryId로 매핑
      const cat = categories.find((c) => c.name === entry.category);
      if (!cat) continue;
      actualByCategoryId.set(cat.id, (actualByCategoryId.get(cat.id) ?? 0) + entry.amount);
    }

    return expenseBudgets.map((b) => {
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
  }, [budgetItems, entries, categories]);
}

export type WeeklyExpense = {
  week: number; // 1~5
  budget: number;
  actual: number;
  status: BudgetStatus | 'future';
};

export function useWeeklyExpenses(
  budgetItems: MonthlyBudgetItem[] | undefined,
  entries: CashbookEntry[] | undefined,
  year: number,
  month: number, // 1~12
  categories?: CashbookCategory[]
): WeeklyExpense[] {
  return useMemo(() => {
    if (!budgetItems || !entries) return [];

    // 변동 지출만 주별 분배 대상
    const variableBudget = budgetItems
      .filter(
        (b) =>
          b.group === 'expense' &&
          (b.subGroup === 'variable_common' || b.subGroup === 'variable_personal')
      )
      .reduce((sum, b) => sum + b.budgetAmount, 0);

    // 고정 지출 카테고리 이름 Set (주별 집계에서 제외)
    const fixedCategoryNames = new Set<string>();
    if (categories) {
      const fixedBudgets = budgetItems.filter(
        (b) => b.group === 'expense' && b.subGroup === 'fixed_expense'
      );
      for (const fb of fixedBudgets) {
        const cat = categories.find((c) => c.id === fb.categoryId);
        if (cat) fixedCategoryNames.add(cat.name);
      }
    }

    // 해당 월의 주 수 계산
    const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-indexed
    const totalWeeks = Math.ceil(daysInMonth / 7);
    const weeklyBudget = Math.round(variableBudget / totalWeeks);

    // 변동 지출 항목만 필터 (고정 지출 카테고리 제외)
    const variableExpenses = entries.filter(
      (e) => e.type === 'expense' && !fixedCategoryNames.has(e.category)
    );

    const now = new Date();
    const currentDay = now.getFullYear() === year && now.getMonth() + 1 === month
      ? now.getDate()
      : month < (now.getMonth() + 1) || year < now.getFullYear()
        ? daysInMonth // 과거 달이면 전체 완료
        : 0; // 미래 달이면 전부 미래

    const weeks: WeeklyExpense[] = [];
    for (let w = 1; w <= totalWeeks; w++) {
      const weekStart = (w - 1) * 7 + 1;
      const weekEnd = Math.min(w * 7, daysInMonth);

      const weekActual = variableExpenses
        .filter((e) => {
          const d = e.date.toDate().getDate();
          return d >= weekStart && d <= weekEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      const isFuture = weekStart > currentDay;

      weeks.push({
        week: w,
        budget: weeklyBudget,
        actual: isFuture ? 0 : weekActual,
        status: isFuture ? 'future' : getBudgetStatus(weeklyBudget, weekActual),
      });
    }

    return weeks;
  }, [budgetItems, entries, year, month, categories]);
}

export type MonthlyOverviewData = {
  incomeBudget: number;
  incomeActual: number;
  expenseBudget: number;
  expenseActual: number;
  balance: number; // 수입실적 - 지출실적
  margin: number; // 예산 - 지출실적
  status: BudgetStatus;
};

export function useMonthlyOverview(
  budgetItems: MonthlyBudgetItem[] | undefined,
  entries: CashbookEntry[] | undefined
): MonthlyOverviewData {
  return useMemo(() => {
    const empty: MonthlyOverviewData = {
      incomeBudget: 0,
      incomeActual: 0,
      expenseBudget: 0,
      expenseActual: 0,
      balance: 0,
      margin: 0,
      status: 'stable',
    };

    if (!budgetItems || !entries) return empty;

    let incomeBudget = 0;
    let expenseBudget = 0;

    for (const item of budgetItems) {
      if (item.group === 'income') incomeBudget += item.budgetAmount;
      if (item.group === 'expense') expenseBudget += item.budgetAmount;
    }

    let incomeActual = 0;
    let expenseActual = 0;

    for (const entry of entries) {
      if (entry.type === 'income') incomeActual += entry.amount;
      if (entry.type === 'expense') expenseActual += entry.amount;
    }

    const balance = incomeActual - expenseActual;
    const margin = expenseBudget - expenseActual;
    const status = getBudgetStatus(expenseBudget, expenseActual);

    return { incomeBudget, incomeActual, expenseBudget, expenseActual, balance, margin, status };
  }, [budgetItems, entries]);
}
