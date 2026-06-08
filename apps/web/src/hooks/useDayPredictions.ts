'use client';

import { useMemo } from 'react';
import dayjs from 'dayjs';
import { usePredictionsInRange } from './usePredictions';
import type { CashbookPrediction } from '@/types';

/**
 * 표시 기간의 '오늘 이후' 미확정 예측을 날짜별(YYYY-MM-DD)로 묶는다(§4-2).
 * - status === 'predicted' && !promptDismissed && date >= 오늘.
 * - 과거 미처리 예측은 회고 배너(PR4)에서 다룬다.
 */
export function useDayPredictions(
  coupleId: string | null,
  start: Date,
  end: Date
): Map<string, CashbookPrediction[]> {
  const { data } = usePredictionsInRange(coupleId, start, end);

  return useMemo(() => {
    const map = new Map<string, CashbookPrediction[]>();
    if (!data) return map;
    const todayStart = dayjs().startOf('day');
    for (const p of data) {
      if (p.status !== 'predicted' || p.promptDismissed) continue;
      const d = dayjs(p.date.toDate());
      if (d.isBefore(todayStart, 'day')) continue;
      const key = d.format('YYYY-MM-DD');
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return map;
  }, [data]);
}

/** CashbookPrediction → 점선 박스 표시용 view. */
export function toPromptView(p: CashbookPrediction) {
  return {
    id: p.id,
    type: p.type,
    amount: p.amount,
    category: p.category,
    description: p.description,
    source: p.source,
    date: p.date.toDate(),
    recurrenceLabel:
      p.source === 'auto' ? `매월 ${dayjs(p.date.toDate()).date()}일` : null,
  };
}
