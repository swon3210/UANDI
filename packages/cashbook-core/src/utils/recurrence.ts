import dayjs, { type Dayjs } from 'dayjs';
import type { RecurringSchedule } from '../types';

/** 주차 라벨 (1~5, -1=마지막) */
export const WEEK_LABELS: Record<string, string> = {
  '1': '첫째',
  '2': '둘째',
  '3': '셋째',
  '4': '넷째',
  '5': '다섯째',
  '-1': '마지막',
};

/** 요일 라벨 (1=월 ~ 7=일) */
export const WEEKDAY_LABELS: Record<number, string> = {
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
  7: '일요일',
};

/** 내부 컨벤션(1=월~7=일) → dayjs 컨벤션(0=일~6=토) */
function toDayjsDow(weekday: number): number {
  return weekday % 7;
}

/** 반복 주기(개월) → 사람이 읽는 접두 라벨. */
export const INTERVAL_LABELS: Record<number, string> = {
  1: '매월',
  2: '격월',
  3: '분기마다',
  6: '반기마다',
  12: '매년',
};

/** 절대 월 인덱스(year*12 + month0). 위상(phase) 계산용. */
function absMonthIndex(year: number, month0: number): number {
  return year * 12 + month0;
}

/**
 * intervalMonths/anchorMonth 위상에 비춰 monthAnchor가 속한 달이 "발생하는 달"인지 판정.
 * - interval ≤ 1 → 항상 발생(매월).
 * - anchorMonth 지정 → 그 달과 위상이 같은 달만(diff % interval === 0).
 * - anchorMonth 미지정 → 절대 월 인덱스 기준 위상 0으로 폴백(결정적).
 */
export function isActiveMonth(schedule: RecurringSchedule, monthAnchor: Dayjs): boolean {
  const interval = schedule.intervalMonths ?? 1;
  if (interval <= 1) return true;

  const current = absMonthIndex(monthAnchor.year(), monthAnchor.month());
  let anchor = 0; // 폴백: 절대 인덱스 위상 0
  if (schedule.anchorMonth) {
    const [ay, am] = schedule.anchorMonth.split('-').map((s) => Number.parseInt(s, 10));
    if (Number.isFinite(ay) && Number.isFinite(am)) anchor = absMonthIndex(ay, am - 1);
  }
  return (((current - anchor) % interval) + interval) % interval === 0;
}

/**
 * 주어진 달(monthAnchor가 속한 달)에서 스케줄의 실제 발생일을 계산한다.
 * - 반복 주기(intervalMonths)상 발생하지 않는 달이면 null(격월/분기 등 건너뛰는 달).
 * - 존재하지 않는 발생일(예: 5번째 월요일이 없는 달)은 null.
 */
export function occurrenceDateInMonth(
  schedule: RecurringSchedule,
  monthAnchor: Dayjs
): Dayjs | null {
  if (!isActiveMonth(schedule, monthAnchor)) return null;

  if (schedule.kind === 'dayOfMonth') {
    const target = schedule.dayOfMonth;
    if (!target || target < 1) return null;
    const day = Math.min(target, monthAnchor.daysInMonth());
    return monthAnchor.date(day).startOf('day');
  }

  // nthWeekday
  const { week, weekday } = schedule;
  if (!week || !weekday) return null;
  const targetDow = toDayjsDow(weekday);
  const startOfMonth = monthAnchor.startOf('month');

  if (week === -1) {
    const endOfMonth = monthAnchor.endOf('month').startOf('day');
    const lastOffset = (endOfMonth.day() - targetDow + 7) % 7;
    return endOfMonth.subtract(lastOffset, 'day');
  }

  const firstOffset = (targetDow - startOfMonth.day() + 7) % 7;
  const candidate = startOfMonth.add(firstOffset + (week - 1) * 7, 'day');
  // week가 그 달에 존재하지 않으면(예: 다섯째 주) 다음 달로 넘어감 → 발생 없음
  if (candidate.month() !== startOfMonth.month()) return null;
  return candidate.startOf('day');
}

/**
 * '오늘'(local) 기준으로 이 스케줄이 오늘 알림을 보내야 하는지 판정한다.
 * 알림일 = 발생일 - leadDays. leadDays로 전월로 넘어가는 경우도 처리하기 위해
 * 이번 달과 다음 달 발생일을 모두 후보로 검사한다.
 */
export function shouldFireOn(schedule: RecurringSchedule, today: Dayjs): boolean {
  if (!schedule.enabled) return false;
  const leadDays = schedule.leadDays ?? 0;
  const day = today.startOf('day');

  const candidates = [
    occurrenceDateInMonth(schedule, day),
    occurrenceDateInMonth(schedule, day.add(1, 'month')),
  ];

  return candidates.some((occ) => {
    if (!occ) return false;
    return occ.subtract(leadDays, 'day').isSame(day, 'day');
  });
}

/** `formatRecurrence` 가 쓰는 표시 라벨. 로케일은 호출 측(web 의 useRecurrenceLabels)이 정한다. */
export type RecurrenceLabels = {
  /** 발생 간격(개월) → "매월" / "격월" / "Every 3 months" */
  interval: (intervalMonths: number) => string;
  /** 주차(1~5, -1=마지막) → "둘째" / "2nd" */
  week: (week: number) => string;
  /** 요일(1=월 … 7=일) → "수요일" / "Wednesday" */
  weekday: (weekday: number) => string;
  /** "{interval} {day}일" / "{interval} on day {day}" */
  dayOfMonth: (intervalLabel: string, day: number) => string;
  /** "{week} 주 {weekday}" / "{week} {weekday}" */
  nthWeekday: (weekLabel: string, weekdayLabel: string) => string;
  /** " · 3일 전" / " · 3 days before" */
  leadDays: (leadDays: number) => string;
};

/** 한국어 기본 라벨 (테스트·로케일 없는 호출용). web 은 useRecurrenceLabels 로 로케일 라벨을 넘긴다. */
export const KO_RECURRENCE_LABELS: RecurrenceLabels = {
  interval: (n) => INTERVAL_LABELS[n] ?? `${n}개월마다`,
  week: (w) => WEEK_LABELS[String(w)] ?? '',
  weekday: (d) => WEEKDAY_LABELS[d] ?? '',
  dayOfMonth: (intervalLabel, day) => `${intervalLabel} ${day}일`,
  nthWeekday: (weekLabel, weekdayLabel) => `${weekLabel} 주 ${weekdayLabel}`.trim(),
  leadDays: (n) => ` · ${n}일 전`,
};

/** 사람이 읽을 수 있는 발생 주기 설명 ("매월 25일", "격월 25일", "분기마다 둘째 주 수요일 · 3일 전") */
export function formatRecurrence(
  schedule: RecurringSchedule,
  labels: RecurrenceLabels = KO_RECURRENCE_LABELS
): string {
  const interval = schedule.intervalMonths ?? 1;
  const intervalLabel = labels.interval(interval);
  let base = '';
  if (schedule.kind === 'dayOfMonth') {
    base = schedule.dayOfMonth
      ? labels.dayOfMonth(intervalLabel, schedule.dayOfMonth)
      : intervalLabel;
  } else {
    const weekLabel = schedule.week != null ? labels.week(schedule.week) : '';
    const weekdayLabel = schedule.weekday ? labels.weekday(schedule.weekday) : '';
    // 매월이면 접두 라벨을 생략("둘째 주 수요일"), 격월 이상만 접두를 붙인다("격월 둘째 주 수요일").
    const cadence = labels.nthWeekday(weekLabel, weekdayLabel).trim();
    base = interval > 1 ? `${intervalLabel} ${cadence}`.trim() : cadence;
  }

  const leadDays = schedule.leadDays ?? 0;
  if (leadDays > 0) base += labels.leadDays(leadDays);
  return base;
}

/** dayjs 인스턴스 노출 (호출측 today 생성 편의) */
export { dayjs };
