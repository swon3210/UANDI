import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/ko';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Timestamp } from 'firebase/firestore';
import type { PeriodSelection } from '@/hooks/useCashbook';
import { getActiveLocale, type Locale } from '@/lib/locale';

// 초기 전역 로케일. 클라이언트에서는 LocaleSync 가 현재 표시 언어로 다시 맞춘다.
dayjs.locale('ko');
dayjs.extend(relativeTime);

/** 표시 언어별 날짜 포맷. 새 포맷이 필요하면 여기에 ko/en 을 함께 추가한다(하드코딩 금지). */
const DATE_FORMATS = {
  ko: {
    full: 'YYYY년 M월 D일',
    monthYear: 'YYYY년 M월',
    monthDay: 'M월 D일',
    year: 'YYYY년',
    shortDate: 'YYYY. M. D.',
  },
  en: {
    full: 'MMM D, YYYY',
    monthYear: 'MMM YYYY',
    monthDay: 'MMM D',
    year: 'YYYY',
    shortDate: 'M/D/YYYY',
  },
} satisfies Record<Locale, Record<string, string>>;

type DateFormatKey = keyof (typeof DATE_FORMATS)['ko'];

/** 현재 표시 언어의 dayjs 포맷 문자열 */
export function dateFormat(key: DateFormatKey): string {
  return DATE_FORMATS[getActiveLocale()][key];
}

export function formatRelativeTime(date: Date | Timestamp | null | undefined): string {
  if (!date) return '';
  const d = 'toDate' in date ? date.toDate() : date;
  return dayjs(d).fromNow();
}

export function formatDate(date: Date | Timestamp): string {
  const d = 'toDate' in date ? date.toDate() : date;
  return dayjs(d).format(dateFormat('full'));
}

export function formatMonthYear(date: Date): string {
  return dayjs(date).format(dateFormat('monthYear'));
}

export function formatDay(date: Date | Timestamp): string {
  const d = 'toDate' in date ? date.toDate() : date;
  return dayjs(d).format(dateFormat('monthDay'));
}

export type PeriodKind = 'monthly' | 'yearly';

const UNIT_BY_PERIOD: Record<PeriodKind, 'month' | 'year'> = {
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
  if (kind === 'monthly') {
    return cursor.format(dateFormat('monthYear'));
  }
  return cursor.format(dateFormat('year'));
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
        label: m.format(dateFormat('monthYear')),
      };
    }
    case 'last3Months': {
      const start = now.subtract(2, 'month').startOf('month');
      const end = now.endOf('month');
      return {
        start: start.toDate(),
        end: end.toDate(),
        label: `${start.format(dateFormat('monthYear'))} ~ ${end.format(dateFormat('monthYear'))}`,
      };
    }
    case 'thisYear': {
      return {
        start: now.startOf('year').toDate(),
        end: now.endOf('year').toDate(),
        label: now.format(dateFormat('year')),
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
        label: `${start.format(dateFormat('shortDate'))} ~ ${end.format(dateFormat('shortDate'))}`,
      };
    }
  }
}
