import type { CashbookEntryType } from '@/types';

/** 타입 필터 칩/탭 노출 순서(지출 → 수입). 빈 선택 = 전체이므로 'all' 항목은 없다. */
export const TYPE_ORDER: CashbookEntryType[] = ['expense', 'income'];
