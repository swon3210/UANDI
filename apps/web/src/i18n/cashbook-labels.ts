'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  formatRecurrence,
  type RecurrenceLabels,
  type RecurringSchedule,
} from '@uandi/cashbook-core';
import type { CategoryGroup, CategorySubGroup } from '@/types';

export type CategoryLabels = {
  group: (group: CategoryGroup) => string;
  subGroup: (subGroup: CategorySubGroup) => string;
  subGroupShort: (subGroup: CategorySubGroup) => string;
};

/**
 * 지출/수입·세부 구분(정기/비정기·고정/변동) 표시 라벨.
 * cashbook-core 의 enum 값은 그대로 두고 라벨만 messages/{locale}/cashbook.json 에서 읽는다.
 */
export function useCategoryLabels(): CategoryLabels {
  const t = useTranslations('cashbook.labels');
  return useMemo(
    () => ({
      group: (group) => t(`group.${group}`),
      subGroup: (subGroup) => t(`subGroup.${subGroup}`),
      subGroupShort: (subGroup) => t(`subGroupShort.${subGroup}`),
    }),
    [t]
  );
}

const INTERVAL_KEYS = ['1', '2', '3', '6', '12'] as const;
const WEEK_KEYS = ['1', '2', '3', '4', '5', '-1'] as const;
const WEEKDAY_KEYS = ['1', '2', '3', '4', '5', '6', '7'] as const;

/** cashbook-core `formatRecurrence` 에 넘기는 로케일 라벨 묶음 */
export function useRecurrenceLabels(): RecurrenceLabels {
  const t = useTranslations('cashbook.recurrence');
  return useMemo<RecurrenceLabels>(
    () => ({
      interval: (n) =>
        (INTERVAL_KEYS as readonly string[]).includes(String(n))
          ? t(`interval.${String(n) as (typeof INTERVAL_KEYS)[number]}`)
          : t('interval.other', { n }),
      week: (w) =>
        (WEEK_KEYS as readonly string[]).includes(String(w))
          ? t(`week.${String(w) as (typeof WEEK_KEYS)[number]}`)
          : '',
      weekday: (d) =>
        (WEEKDAY_KEYS as readonly string[]).includes(String(d))
          ? t(`weekday.${String(d) as (typeof WEEKDAY_KEYS)[number]}`)
          : '',
      dayOfMonth: (interval, day) => t('dayOfMonth', { interval, day }),
      nthWeekday: (week, weekday) => t('nthWeekday', { week, weekday }),
      leadDays: (n) => t('leadDays', { n }),
    }),
    [t]
  );
}

/** 현재 로케일로 "매월 25일" / "Monthly on day 25" 같은 발생 주기 문구를 만든다 */
export function useFormatRecurrence(): (schedule: RecurringSchedule) => string {
  const labels = useRecurrenceLabels();
  return useCallback((schedule) => formatRecurrence(schedule, labels), [labels]);
}
