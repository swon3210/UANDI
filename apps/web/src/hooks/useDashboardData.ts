import { useMemo } from 'react';
import { type Dayjs } from 'dayjs';
import { useCashbookEntriesInRange } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { getPeriodRange, type PeriodKind } from '@/utils/date';
import type { CashbookEntry, CashbookCategory, CategoryGroup } from '@/types';

export type GroupFilter = 'all' | CategoryGroup;

export type CategorySlice = {
  category: string;
  amount: number;
  color: string;
};

export type DashboardData = {
  byCategory: CategorySlice[];
  total: number;
  hasEntries: boolean;
  isLoading: boolean;
};

// 카테고리별 시각적 구분을 위한 고대비 팔레트.
// 카테고리 메타의 color는 대부분 코랄 계열이라 라인/슬라이스가 구분이 안 되어
// 차트 표시 시에는 메타 색상을 덮어쓴다.
const CHART_PALETTE = [
  '#D8635A', // coral red (지출 시맨틱)
  '#4CAF86', // sage green (수입 시맨틱)
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#A855F7', // purple
  '#F97316', // orange
  '#0EA5E9', // sky
];

function categoryColor(
  _name: string,
  _categories: CashbookCategory[] | undefined,
  index: number
): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

function buildByCategory(
  entries: CashbookEntry[],
  categories: CashbookCategory[] | undefined
): CategorySlice[] {
  const sums = new Map<string, number>();
  for (const entry of entries) {
    sums.set(entry.category, (sums.get(entry.category) ?? 0) + entry.amount);
  }

  const slices: CategorySlice[] = [];
  let i = 0;
  for (const [category, amount] of sums.entries()) {
    slices.push({ category, amount, color: categoryColor(category, categories, i) });
    i++;
  }
  return slices.sort((a, b) => b.amount - a.amount);
}

function computeTotal(entries: CashbookEntry[], group: GroupFilter): number {
  if (group === 'all') {
    let income = 0;
    let expense = 0;
    for (const e of entries) {
      if (e.type === 'income') income += e.amount;
      else if (e.type === 'expense') expense += e.amount;
    }
    return income - expense;
  }
  return entries.reduce((sum, e) => sum + e.amount, 0);
}

export function useDashboardData(args: {
  coupleId: string | null;
  period: PeriodKind;
  group: GroupFilter;
  cursor: Dayjs;
}): DashboardData {
  const { coupleId, period, group, cursor } = args;
  const { start, end } = useMemo(() => getPeriodRange(period, cursor), [period, cursor]);

  const entriesQuery = useCashbookEntriesInRange(coupleId, start, end);
  const categoriesQuery = useCashbookCategories(coupleId);

  return useMemo(() => {
    const allEntries = entriesQuery.data ?? [];
    const filtered = group === 'all' ? allEntries : allEntries.filter((e) => e.type === group);

    return {
      byCategory: buildByCategory(filtered, categoriesQuery.data),
      total: computeTotal(filtered, group),
      hasEntries: filtered.length > 0,
      isLoading: entriesQuery.isLoading || categoriesQuery.isLoading,
    };
  }, [
    entriesQuery.data,
    entriesQuery.isLoading,
    categoriesQuery.data,
    categoriesQuery.isLoading,
    group,
  ]);
}
