import type { CashbookEntryType } from '@/types';
import { GROUP_LABELS } from '@/constants/default-categories';

/** 타입 필터 칩/탭 노출 순서(지출 → 수입 → Flex). 빈 선택 = 전체이므로 'all' 항목은 없다. */
export const TYPE_ORDER: CashbookEntryType[] = ['expense', 'income', 'flex'];

export const TYPE_LABELS: Record<CashbookEntryType, string> = {
  expense: GROUP_LABELS.expense,
  income: GROUP_LABELS.income,
  flex: GROUP_LABELS.flex,
};
