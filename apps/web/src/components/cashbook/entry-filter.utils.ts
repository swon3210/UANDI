import type { CashbookCategory, CategoryGroup } from '@/types';
import type { EntryFilterType } from '@/hooks/useCashbook';
import { GROUP_LABELS } from '@/constants/default-categories';

export const TYPE_ORDER: EntryFilterType[] = ['all', 'expense', 'income', 'flex'];

export const TYPE_LABELS: Record<EntryFilterType, string> = {
  all: '전체',
  expense: GROUP_LABELS.expense,
  income: GROUP_LABELS.income,
  flex: GROUP_LABELS.flex,
};

/** 타입 필터에 맞는 카테고리만 추려 sortOrder 순으로 정렬한다. */
export function getVisibleCategories(
  categories: CashbookCategory[],
  typeFilter: EntryFilterType
): CashbookCategory[] {
  const filtered =
    typeFilter === 'all'
      ? categories
      : categories.filter((c) => c.group === (typeFilter as CategoryGroup));
  return [...filtered].sort((a, b) => a.sortOrder - b.sortOrder);
}
