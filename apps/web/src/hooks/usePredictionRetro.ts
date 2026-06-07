'use client';

import { useMemo } from 'react';
import dayjs from 'dayjs';
import { usePredictionsInRange } from './usePredictions';
import { useSsrSafeLocalStorage } from './useSsrSafeLocalStorage';
import type { CashbookPrediction } from '@/types';

const LOOKBACK_DAYS = 365;

/**
 * §SYNC-06 회고 대상: status='predicted' && !promptDismissed && date <= 어제.
 * "매일 1회"는 localStorage(retro-shown::{coupleId}::{오늘})로 게이트한다.
 */
export function usePredictionRetro(coupleId: string | null): {
  items: CashbookPrediction[];
  dismiss: () => void;
} {
  const range = useMemo(() => {
    const to = dayjs().subtract(1, 'day').endOf('day');
    const from = dayjs().subtract(LOOKBACK_DAYS, 'day').startOf('day');
    return { from: from.toDate(), to: to.toDate() };
  }, []);

  const { data } = usePredictionsInRange(coupleId, range.from, range.to);

  const items = useMemo(
    () => (data ?? []).filter((p) => p.status === 'predicted' && !p.promptDismissed),
    [data]
  );

  const todayKey = dayjs().format('YYYY-MM-DD');
  const storageKey = `retro-shown::${coupleId ?? '__none'}`;
  const [shownMap, setShownMap] = useSsrSafeLocalStorage<Record<string, boolean>>(storageKey, {});

  const dismiss = () => setShownMap({ ...shownMap, [todayKey]: true });

  return { items: shownMap[todayKey] ? [] : items, dismiss };
}
