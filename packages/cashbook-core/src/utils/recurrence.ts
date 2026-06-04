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

/**
 * 주어진 달(monthAnchor가 속한 달)에서 스케줄의 실제 발생일을 계산한다.
 * 존재하지 않는 발생일(예: 5번째 월요일이 없는 달)은 null.
 */
export function occurrenceDateInMonth(
  schedule: RecurringSchedule,
  monthAnchor: Dayjs
): Dayjs | null {
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

/** 사람이 읽을 수 있는 발생 주기 설명 ("매월 25일", "둘째 주 수요일 · 3일 전") */
export function formatRecurrence(schedule: RecurringSchedule): string {
  let base = '';
  if (schedule.kind === 'dayOfMonth') {
    base = schedule.dayOfMonth ? `매월 ${schedule.dayOfMonth}일` : '매월';
  } else {
    const weekLabel = schedule.week != null ? WEEK_LABELS[String(schedule.week)] : '';
    const weekdayLabel = schedule.weekday ? WEEKDAY_LABELS[schedule.weekday] : '';
    base = `${weekLabel} 주 ${weekdayLabel}`.trim();
  }

  const leadDays = schedule.leadDays ?? 0;
  if (leadDays > 0) base += ` · ${leadDays}일 전`;
  return base;
}

/** dayjs 인스턴스 노출 (호출측 today 생성 편의) */
export { dayjs };
