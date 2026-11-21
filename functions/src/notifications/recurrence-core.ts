/**
 * 정기 발생(recurrence) 날짜 계산 — 의존성 없는 순수 함수 모음.
 *
 * Cloud Functions는 cashbook-core(web SDK 패키지)를 import할 수 없어 동일 로직을 plain Date로
 * 재구현한다(모든 계산은 UTC 캘린더 기준, '오늘'은 Asia/Seoul 날짜를 UTC 자정으로 옮겨 넘긴다).
 * `packages/cashbook-core/src/utils/recurrence.ts`와 판정 결과가 일치해야 한다.
 *
 * firebase import를 두지 않는다 — `functions/test/recurrence-core.test.mjs`가 빌드 산출물을 직접 돌린다.
 * 명세: docs/pages/inner/cashbook-recurring-alerts.md, cashbook-recurring-auto-record.md
 */

export type RecurringSchedule = {
  enabled: boolean;
  kind: 'dayOfMonth' | 'nthWeekday';
  dayOfMonth?: number;
  week?: number;
  weekday?: number;
  leadDays?: number;
  expectedAmount?: number | null;
  /** 반복 주기(개월). 1=매월(기본), 2=격월, 3=분기, 6=반기, 12=매년. 미지정 시 1. */
  intervalMonths?: number;
  /** 주기 위상 기준 달("YYYY-MM"). interval > 1일 때 이 달과 같은 위상의 달만 발생. */
  anchorMonth?: string;
  /** 발생일에 실제 내역을 자동 생성할지. */
  autoRecord?: boolean;
  /** 자동 기록 내역의 작성자 uid. */
  payerUid?: string | null;
};

const DAY_MS = 86_400_000;
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

export function utcDate(year: number, month0: number, day: number): Date {
  return new Date(Date.UTC(year, month0, day));
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** 내부 컨벤션(1=월~7=일) → JS getUTCDay 컨벤션(0=일~6=토) */
function toJsDow(weekday: number): number {
  return weekday % 7;
}

/** Asia/Seoul 기준 '오늘'의 캘린더 날짜를 UTC 자정 Date로 반환 */
export function seoulToday(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return utcDate(get('year'), get('month') - 1, get('day'));
}

/**
 * intervalMonths/anchorMonth 위상에 비춰 (year, month0)이 "발생하는 달"인지.
 * cashbook-core의 isActiveMonth와 동일 로직(격월/분기 건너뛰는 달 판정).
 */
export function isActiveMonth(schedule: RecurringSchedule, year: number, month0: number): boolean {
  const interval = schedule.intervalMonths ?? 1;
  if (interval <= 1) return true;

  const current = year * 12 + month0;
  let anchor = 0; // 폴백: 절대 인덱스 위상 0
  if (schedule.anchorMonth) {
    const [ay, am] = schedule.anchorMonth.split('-').map((s) => Number.parseInt(s, 10));
    if (Number.isFinite(ay) && Number.isFinite(am)) anchor = ay * 12 + (am - 1);
  }
  return (((current - anchor) % interval) + interval) % interval === 0;
}

/** (year, month0) 달의 발생일. 주기상 건너뛰는 달이거나 해당 날이 없으면 null. */
export function occurrenceDate(
  schedule: RecurringSchedule,
  year: number,
  month0: number
): Date | null {
  if (!isActiveMonth(schedule, year, month0)) return null;

  if (schedule.kind === 'dayOfMonth') {
    const target = schedule.dayOfMonth;
    if (!target || target < 1) return null;
    const day = Math.min(target, daysInMonth(year, month0));
    return utcDate(year, month0, day);
  }

  const { week, weekday } = schedule;
  if (!week || !weekday) return null;
  const targetDow = toJsDow(weekday);

  if (week === -1) {
    const lastDay = daysInMonth(year, month0);
    const lastDate = utcDate(year, month0, lastDay);
    const lastOffset = (lastDate.getUTCDay() - targetDow + 7) % 7;
    return utcDate(year, month0, lastDay - lastOffset);
  }

  const first = utcDate(year, month0, 1);
  const firstOffset = (targetDow - first.getUTCDay() + 7) % 7;
  const day = 1 + firstOffset + (week - 1) * 7;
  if (day > daysInMonth(year, month0)) return null;
  return utcDate(year, month0, day);
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

export function sameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** today(UTC 자정 캘린더 날짜) 기준으로 이 스케줄이 오늘 리마인더를 보내야 하는지 (알림일 = 발생일 - leadDays) */
export function shouldFireOn(schedule: RecurringSchedule, today: Date): boolean {
  if (!schedule.enabled) return false;
  const leadDays = schedule.leadDays ?? 0;
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const candidates = [
    occurrenceDate(schedule, y, m),
    occurrenceDate(schedule, m === 11 ? y + 1 : y, (m + 1) % 12),
  ];
  return candidates.some((occ) => occ != null && sameUtcDay(addDays(occ, -leadDays), today));
}

/** 'YYYY-MM-DD' */
export function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM' */
export function monthKey(d: Date): string {
  return dateKey(d).slice(0, 7);
}

/** monthKey 비교: a가 b보다 뒤인 달인가. 'YYYY-MM' 포맷은 사전순 == 시간순. */
export function isLaterMonth(a: string, b: string): boolean {
  return a > b;
}

/** 자동 기록 내역 문서 id (결정적 — 같은 달 이중 생성 방지) */
export function autoRecordEntryId(categoryId: string, month: string): string {
  return `recurrence-${categoryId}-${month}`;
}

/**
 * [today-(windowDays-1), today] 구간에 떨어지는 발생일을 오래된 순으로 돌려준다. 미래는 제외.
 * cron이 며칠 빠져도 다음 실행에서 빠진 발생분을 채우는 catch-up 입력(자동 기록 D5).
 * 구간이 월 경계를 넘을 수 있어 전월·당월 발생일을 모두 후보로 본다.
 */
export function occurrencesInWindow(
  schedule: RecurringSchedule,
  today: Date,
  windowDays: number
): Date[] {
  if (!schedule.enabled || windowDays < 1) return [];
  const start = addDays(today, -(windowDays - 1));
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const prevY = m === 0 ? y - 1 : y;
  const prevM = (m + 11) % 12;

  const candidates = [occurrenceDate(schedule, prevY, prevM), occurrenceDate(schedule, y, m)];
  return candidates
    .filter((occ): occ is Date => occ != null)
    .filter((occ) => occ.getTime() >= start.getTime() && occ.getTime() <= today.getTime())
    .sort((a, b) => a.getTime() - b.getTime());
}

/**
 * UTC 자정으로 표현된 캘린더 날짜 → 그 날 Asia/Seoul 00:00의 실제 시각.
 * 앱은 내역 date를 사용자 로컬 자정(dayjs(date).toDate())으로 저장하므로 자동 기록도 같은 관례를 따른다.
 */
export function seoulMidnightToUtc(d: Date): Date {
  return new Date(d.getTime() - SEOUL_OFFSET_MS);
}

/** 해당 달 전체를 덮는 [Asia/Seoul 월초 00:00, 다음 달 00:00) 실제 시각 구간 (G1 조회용) */
export function seoulMonthRange(month: string): { start: Date; end: Date } {
  const [y, m] = month.split('-').map((s) => Number.parseInt(s, 10));
  const start = seoulMidnightToUtc(utcDate(y, m - 1, 1));
  const end = seoulMidnightToUtc(utcDate(m === 12 ? y + 1 : y, m % 12, 1));
  return { start, end };
}
