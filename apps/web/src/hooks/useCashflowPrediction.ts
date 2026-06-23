'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { predictCashflow } from '@/services/ai';
import { useCashbookEntriesInRange } from './useCashbook';
import { useCashbookCategories } from './useCashbookCategories';
import { useSsrSafeLocalStorage } from './useSsrSafeLocalStorage';
import { CASHFLOW_HORIZON_MONTHS } from './useCashflowCalendar';
import type { LlmPrediction } from '@/utils/cashflow';

/** LLM 예측 입력으로 볼 과거 내역 기간(개월). */
export const LLM_PREDICTION_LOOKBACK_MONTHS = 6;

/** localStorage에 저장하는 예측 캐시. presence 자체가 "한 번이라도 추론한 적 있음"을 의미한다. */
type StoredPredictions = {
  predictions: LlmPrediction[];
  /** 마지막 추론 시각(ISO). 표시용. */
  ranAt: string;
};

export type CashflowPredictionResult = {
  predictions: LlmPrediction[];
  /** "갱신" 버튼 핸들러 — 누르면 LLM을 다시 호출하고 캐시를 덮어쓴다. */
  refresh: () => void;
  /** 추론 진행 중(자동 첫 로드 또는 갱신). */
  isPending: boolean;
  /** 한 번이라도 추론한 적이 있는지(캐시 존재 여부). */
  hasRun: boolean;
  /** 마지막 추론 시각(ISO) 또는 null. */
  ranAt: string | null;
};

/**
 * 과거 소비/수입 패턴을 LLM으로 분석해 향후 예상 지출/수입을 받아온다.
 * - 페이지 진입 시 **캐시가 없으면 자동으로 1회** 추론한다.
 * - 결과는 localStorage(커플별)에 영속한다 → 앱을 껐다 켜도(같은 기기) 재추론하지 않고 캐시를 보여준다.
 * - 다시 추론하는 경우는 오직 **"갱신" 버튼(refresh)** 뿐이다.
 * 결과는 useCashflowCalendar에 넘겨 현금흐름 카드의 들어올/나갈/남는 돈에 반영된다.
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

  const storageKey = `cashflow-llm-predictions:${coupleId ?? 'anon'}`;
  const [stored, setStored] = useSsrSafeLocalStorage<StoredPredictions | null>(storageKey, null);

  // 추론 입력(과거 내역·카테고리)이 로드됐는지. 자동 1회 추론은 이게 준비된 뒤에만 보낸다.
  const dataReady = pastEntries !== undefined && categories !== undefined;

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
    onSuccess: (predictions) => {
      setStored({ predictions, ranAt: new Date().toISOString() });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'AI 예측에 실패했어요. 다시 시도해주세요.');
    },
  });

  // 진입 시 자동 1회 추론: 캐시가 없고(=한 번도 추론 안 함) 입력이 준비됐을 때만.
  // 이후엔 캐시가 생겨 다시 자동 추론되지 않는다(갱신 버튼만 재추론).
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (!coupleId || !dataReady) return;
    if (stored !== null) return; // 이미 추론한 적 있음 → 자동 추론 안 함
    if (autoRanRef.current) return;
    autoRanRef.current = true;
    mutation.mutate();
    // mutation은 의존성에서 제외(매 렌더 새 객체) — ref·stored·dataReady 가드로 1회만 실행.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId, dataReady, stored]);

  const refresh = () => mutation.mutate();

  return {
    // 최신 추론 결과가 있으면 그것, 없으면 캐시.
    predictions: mutation.data ?? stored?.predictions ?? [],
    refresh,
    isPending: mutation.isPending,
    hasRun: stored !== null || mutation.isSuccess,
    ranAt: stored?.ranAt ?? null,
  };
}
