export type { DefaultCategory } from '@uandi/cashbook-core';
// 표시 라벨(지출/수입·세부 구분)은 로케일을 타므로 상수 대신 `@/i18n/cashbook-labels` 의 useCategoryLabels 를 쓴다.
export {
  SUB_GROUPS_BY_GROUP,
  RECURRENCE_SUBGROUPS,
  recurrenceSubGroupFor,
  DEFAULT_CATEGORIES,
  COLOR_PRESETS,
} from '@uandi/cashbook-core';
