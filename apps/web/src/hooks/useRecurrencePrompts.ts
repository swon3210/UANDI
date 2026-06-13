'use client';

import { useMemo } from 'react';
import dayjs from 'dayjs';
import { formatRecurrence } from '@uandi/cashbook-core/utils/recurrence';
import { useCashbookCategories } from './useCashbookCategories';
import { useCashbookEntriesInRange } from './useCashbook';
import { usePredictionsInRange } from './usePredictions';
import { buildRecurrenceOccurrences, recurrenceMonthKey } from '@/utils/cashflow';
import type { PredictionPromptView } from '@/components/cashbook/PredictionPromptBox';

/**
 * 카테고리 정기 발생(recurrence)을 내역 페이지 "예상 수입/지출" 프롬프트로 읽기 시점에 파생한다(Phase 4).
 * docs/pages/inner/cashflow-recurrence-integration.md 참고.
 * - 표시 구간: `[오늘, range.end]` (과거 달이면 비어 있음 — useDayPredictions와 동일하게 date >= 오늘).
 * - G1: 같은 달 같은 카테고리 실거래가 있으면 제외(이미 기록됨).
 * - G2: 같은 달 같은 카테고리 활성 예측 doc이 있으면 제외(doc 프롬프트와 중복 방지).
 * - 반환: 날짜키(YYYY-MM-DD) → recurrence 프롬프트 뷰 목록. doc이 없어 `kind: 'recurrence'`로 표시.
 */
export function useRecurrencePrompts(
  coupleId: string | null,
  range: { start: Date; end: Date }
): Map<string, PredictionPromptView[]> {
  const { data: categories } = useCashbookCategories(coupleId);
  // 같은 쿼리키라 useCashbook/useDayPredictions와 React Query 캐시를 공유(중복 페치 없음).
  const { data: entries } = useCashbookEntriesInRange(coupleId, range.start, range.end);
  const { data: predictions } = usePredictionsInRange(coupleId, range.start, range.end);

  return useMemo(() => {
    const map = new Map<string, PredictionPromptView[]>();
    if (!categories) return map;

    const rangeEnd = dayjs(range.end);
    const occurrences = buildRecurrenceOccurrences(categories, {
      from: dayjs().startOf('day'),
      months: 1,
    }).filter((o) => !dayjs(o.date).isAfter(rangeEnd));
    if (occurrences.length === 0) return map;

    // G1: 같은 달 실거래 / G2: 같은 달 활성 예측 doc → 그 달 발생분 제외.
    const actualKeys = new Set<string>();
    for (const e of entries ?? []) actualKeys.add(recurrenceMonthKey(e.category, e.date.toDate()));
    const predictionKeys = new Set<string>();
    for (const p of predictions ?? []) {
      if (p.status === 'predicted') {
        predictionKeys.add(recurrenceMonthKey(p.category, p.date.toDate()));
      }
    }

    const scheduleByCategoryId = new Map(
      categories.filter((c) => c.recurrence).map((c) => [c.id, c.recurrence!] as const)
    );

    for (const o of occurrences) {
      const monthKey = recurrenceMonthKey(o.categoryName, o.date);
      if (actualKeys.has(monthKey)) continue; // G1
      if (predictionKeys.has(monthKey)) continue; // G2

      const schedule = scheduleByCategoryId.get(o.categoryId);
      const dateKey = dayjs(o.date).format('YYYY-MM-DD');
      const view: PredictionPromptView = {
        id: `recurrence-${o.categoryId}-${dateKey}`,
        kind: 'recurrence',
        type: o.type,
        amount: o.amount,
        category: o.categoryName,
        description: '',
        source: 'calendar', // recurrence는 라벨을 kind로 대체하므로 source는 표시에 안 쓰임
        date: o.date,
        recurrenceLabel: schedule ? formatRecurrence(schedule) : null,
      };
      const list = map.get(dateKey) ?? [];
      list.push(view);
      map.set(dateKey, list);
    }

    return map;
  }, [categories, entries, predictions, range.end]);
}
