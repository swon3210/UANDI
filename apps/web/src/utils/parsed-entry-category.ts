import type { CashbookCategory, CashbookEntryType } from '@/types';

/**
 * AI 파싱 결과의 카테고리를 사용자가 직접 골라야 하는지.
 * 서버는 목록에 없는 카테고리를 ''로 비워 보내고, 여기서는 수입/지출 그룹까지 맞는지 확인한다.
 * (AI가 지어낸 카테고리가 그대로 저장돼 내역이 꼬이는 것을 막는다)
 */
export function needsCategoryReview(
  entry: { type: CashbookEntryType; category: string },
  categories: CashbookCategory[]
): boolean {
  if (!entry.category) return true;
  return !categories.some((c) => c.name === entry.category && c.group === entry.type);
}
