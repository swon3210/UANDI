import { RECURRENCE_SUBGROUPS } from '../constants/default-categories';
import type { CategorySubGroup, RecurringSchedule } from '../types';

export type RecurrenceCleanupCategory = {
  id: string;
  subGroup: CategorySubGroup;
  recurrence?: RecurringSchedule | null;
};

/**
 * 정기 발생(recurrence)은 고정 지출/정기 수입(RECURRENCE_SUBGROUPS)에만 붙을 수 있다.
 * 변동 지출·비정기 수입 카테고리에 recurrence가 남아 있으면 잘못된 데이터다
 * (현금흐름 정기 발생 제안이 변동 카테고리에도 "정기 지출 등록"을 허용했던 버그의 산출물).
 */
export function hasInvalidRecurrence(category: RecurrenceCleanupCategory): boolean {
  return category.recurrence != null && !RECURRENCE_SUBGROUPS.includes(category.subGroup);
}

/**
 * 잘못 붙은 recurrence를 제거할 카테고리 id 목록. 멱등: 이미 null인 카테고리는 포함되지 않는다.
 * 실제 쓰기는 `{ recurrence: null }` 업데이트(스크립트 `scripts/migrate-remove-variable-recurrence.ts`).
 */
export function planInvalidRecurrenceCleanup(
  categories: readonly RecurrenceCleanupCategory[]
): string[] {
  return categories.filter(hasInvalidRecurrence).map((c) => c.id);
}
