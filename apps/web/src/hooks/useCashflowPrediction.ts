'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { predictCashflow } from '@/services/ai';
import { useCashbookEntriesInRange } from './useCashbook';
import { useCashbookCategories } from './useCashbookCategories';
import { CASHFLOW_HORIZON_MONTHS } from './useCashflowCalendar';
import type { LlmPrediction } from '@/utils/cashflow';

/** LLM 예측 입력으로 볼 과거 내역 기간(개월). */
export const LLM_PREDICTION_LOOKBACK_MONTHS = 6;

export type CashflowPredictionResult = {
  predictions: LlmPrediction[];
  /** 버튼 핸들러 — 누를 때마다 LLM을 새로 호출한다(캐시 없음). */
  run: () => void;
  isPending: boolean;
  /** 한 번이라도 성공적으로 받아왔는지(빈 결과 안내 분기용). */
  hasRun: boolean;
};

/**
 * 과거 소비/수입 패턴을 LLM으로 분석해 향후 예상 지출/수입을 받아온다.
 * 표시 전용(잔액 미반영) — 결과는 useCashflowCalendar에 넘겨 "AI 예상 내역"으로 렌더한다.
 * 버튼을 누를 때마다 호출하므로 useMutation을 쓴다(자동 호출/캐시 없음).
 */
export function useCashflowPrediction(coupleId: string | null): CashflowPredictionResult {
  const from = useMemo(() => dayjs().startOf('day'), []);
  const horizonEnd = useMemo(
    () => from.add(CASHFLOW_HORIZON_MONTHS, 'month').endOf('day'),
    [from]
  );
  const pastFrom = useMemo(
    () => from.subtract(LLM_PREDICTION_LOOKBACK_MONTHS, 'month').toDate(),
    [from]
  );

  const { data: pastEntries } = useCashbookEntriesInRange(coupleId, pastFrom, from.toDate());
  const { data: categories } = useCashbookCategories(coupleId);

  const mutation = useMutation({
    mutationFn: () => {
      const declaredCategories = (categories ?? [])
        .filter((c) => c.recurrence?.enabled)
        .map((c) => c.name);
      return predictCashflow({
        entries: (pastEntries ?? []).map((e) => ({
          type: e.type,
          amount: e.amount,
          category: e.category,
          date: dayjs(e.date.toDate()).format('YYYY-MM-DD'),
          description: e.description,
        })),
        horizonStart: from.format('YYYY-MM-DD'),
        horizonEnd: horizonEnd.format('YYYY-MM-DD'),
        declaredCategories,
        categories: (categories ?? []).map((c) => c.name),
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'AI 예측에 실패했어요. 다시 시도해주세요.');
    },
  });

  return {
    predictions: mutation.data ?? [],
    run: () => mutation.mutate(),
    isPending: mutation.isPending,
    hasRun: mutation.isSuccess,
  };
}
