'use client';

import { useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import { dateFormat } from '@/utils/date';
import {
  formatRecurrence,
  type RecurrenceLabels,
  type RecurringSchedule,
} from '@uandi/cashbook-core';
import type { CategoryGroup, CategorySubGroup } from '@/types';
import { josa } from '@/utils/josa';

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

/** 1월…12월 / Jan…Dec — 위저드·월 그리드 열 머리글 */
export function useMonthLabels(): string[] {
  const locale = useLocale();
  return useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        dayjs().month(i).startOf('month').format(dateFormat('monthShort'))
      ),
    // 로케일이 바뀌면 dateFormat 결과가 달라진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  );
}

/**
 * 문장 주어에 붙는 조사 처리. 한국어면 받침에 맞춰 "이/가"를 붙이고("식비가"), 그 외 로케일은 그대로.
 * 메시지는 `{subject} 예산을 넘었어요` / `{subject} is over budget` 처럼 주어를 인자로 받는다.
 */
export function useSubjectParticle(): (label: string) => string {
  const locale = useLocale();
  return useCallback((label: string) => (locale === 'ko' ? josa(label, '이/가') : label), [locale]);
}
