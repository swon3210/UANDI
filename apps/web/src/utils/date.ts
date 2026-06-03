import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/ko';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Timestamp } from 'firebase/firestore';
import type { PeriodSelection } from '@/hooks/useCashbook';

dayjs.locale('ko');
dayjs.extend(relativeTime);

export function formatRelativeTime(date: Date | Timestamp | null | undefined): string {
  if (!date) return '';
  const d = 'toDate' in date ? date.toDate() : date;
  return dayjs(d).fromNow();
}

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

export function getPeriodRange(kind: PeriodKind, cursor: Dayjs): { start: Date; end: Date } {
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

export type CashbookPeriodResult = { start: Date; end: Date; label: string };

/**
 * 가계부 기간 필터 선택값(프리셋/커스텀)을 조회용 날짜 범위 + 라벨로 해석한다.
 * `now`는 호출부에서 useMemo로 고정해 queryKey 안정성을 확보할 것.
 */
export function resolvePeriod(
  selection: PeriodSelection,
  now: Dayjs = dayjs()
): CashbookPeriodResult {
  switch (selection.mode) {
    case 'month': {
      const m = dayjs(new Date(selection.year, selection.month, 1));
      return {
        start: m.startOf('month').toDate(),
        end: m.endOf('month').toDate(),
        label: m.format('YYYY년 M월'),
      };
    }
    case 'last3Months': {
      const start = now.subtract(2, 'month').startOf('month');
      const end = now.endOf('month');
      return {
        start: start.toDate(),
        end: end.toDate(),
        label: `${start.format('YYYY년 M월')} ~ ${end.format('YYYY년 M월')}`,
      };
    }
    case 'thisYear': {
      return {
        start: now.startOf('year').toDate(),
        end: now.endOf('year').toDate(),
        label: now.format('YYYY년'),
      };
    }
    case 'custom': {
      let start = dayjs(selection.start);
      let end = dayjs(selection.end);
      if (end.isBefore(start)) {
        [start, end] = [end, start]; // 방어: 뒤집힌 범위 swap
      }
      start = start.startOf('day');
      end = end.endOf('day');
      return {
        start: start.toDate(),
        end: end.toDate(),
        label: `${start.format('YYYY. M. D.')} ~ ${end.format('YYYY. M. D.')}`,
      };
    }
  }
}
