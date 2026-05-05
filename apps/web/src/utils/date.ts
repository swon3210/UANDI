import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/ko';
import type { Timestamp } from 'firebase/firestore';

dayjs.locale('ko');

export function formatDate(date: Date | Timestamp): string {
  const d = 'toDate' in date ? date.toDate() : date;
  return dayjs(d).format('YYYY년 M월 D일');
}

export function formatMonthYear(date: Date): string {
  return dayjs(date).format('YYYY년 M월');
}

export function formatDay(date: Date | Timestamp): string {
  const d = 'toDate' in date ? date.toDate() : date;
  return dayjs(d).format('M월 D일');
}

export type PeriodKind = 'weekly' | 'monthly' | 'yearly';

const UNIT_BY_PERIOD: Record<PeriodKind, 'week' | 'month' | 'year'> = {
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
};

export function getPeriodRange(
  kind: PeriodKind,
  cursor: Dayjs
): { start: Date; end: Date } {
  const unit = UNIT_BY_PERIOD[kind];
  return {
    start: cursor.startOf(unit).toDate(),
    end: cursor.endOf(unit).toDate(),
  };
}

export function getPeriodLabel(kind: PeriodKind, cursor: Dayjs): string {
  if (kind === 'weekly') {
    const start = cursor.startOf('week');
    const end = cursor.endOf('week');
    return `${start.format('M월 D일')} ~ ${end.format('D일')}`;
  }
  if (kind === 'monthly') {
    return cursor.format('YYYY년 M월');
  }
  return cursor.format('YYYY년');
}

export function isCurrentPeriod(kind: PeriodKind, cursor: Dayjs): boolean {
  return cursor.isSame(dayjs(), UNIT_BY_PERIOD[kind]);
}

export function shiftPeriod(kind: PeriodKind, cursor: Dayjs, delta: number): Dayjs {
  return cursor.add(delta, UNIT_BY_PERIOD[kind]);
}

export function normalizeCursor(kind: PeriodKind, cursor: Dayjs): Dayjs {
  return cursor.startOf(UNIT_BY_PERIOD[kind]);
}
