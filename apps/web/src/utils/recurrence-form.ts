import type { RecurringSchedule } from '@/types';

/** CategoryForm의 recurrence 필드 값(폼 전용 shape). */
export type RecurrenceFormValue = {
  enabled: boolean;
  kind: 'dayOfMonth' | 'nthWeekday';
  dayOfMonth?: number;
  week?: number;
  weekday?: number;
  leadDays?: number;
  expectedAmount?: number | null;
  intervalMonths?: number;
  anchorMonth?: string;
  autoRecord?: boolean;
  payerUid?: string | null;
};

/**
 * 폼 값 → Firestore 저장용 payload. undefined 필드를 제거하고(Firestore가 거부),
 * 설정이 전혀 없으면 null을 반환한다.
 */
export function buildRecurrencePayload(value: RecurrenceFormValue): RecurringSchedule | null {
  const hasConfig =
    value.dayOfMonth != null ||
    value.week != null ||
    value.weekday != null ||
    value.expectedAmount != null;
  if (!value.enabled && !hasConfig) return null;

  const payload: RecurringSchedule = { enabled: value.enabled, kind: value.kind };
  if (value.kind === 'dayOfMonth') {
    if (value.dayOfMonth != null) payload.dayOfMonth = value.dayOfMonth;
  } else {
    if (value.week != null) payload.week = value.week as RecurringSchedule['week'];
    if (value.weekday != null) payload.weekday = value.weekday;
  }
  if (value.leadDays != null) payload.leadDays = value.leadDays;
  payload.expectedAmount = value.expectedAmount ?? null;
  // 반복 주기: 격월 이상일 때만 저장(매월=기본이라 생략, 하위호환). anchorMonth는 위상 기준.
  const interval = value.intervalMonths ?? 1;
  if (interval > 1) {
    payload.intervalMonths = interval;
    if (value.anchorMonth) payload.anchorMonth = value.anchorMonth;
  }
  // 자동 기록(docs/pages/inner/cashbook-recurring-auto-record.md): 켜진 경우에만 저장(하위호환).
  // 예상 금액이 양수가 아니면 켜져 있어도 저장하지 않는다(D2 — cron도 같은 조건으로 거른다).
  const amount = payload.expectedAmount;
  if (value.autoRecord && amount != null && amount > 0 && value.payerUid) {
    payload.autoRecord = true;
    payload.payerUid = value.payerUid;
  }
  return payload;
}
