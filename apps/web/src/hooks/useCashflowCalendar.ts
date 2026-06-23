'use client';

import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useCashflowSettings } from './useCashflowSettings';
import { useCashbookEntriesInRange } from './useCashbook';
import { useActivePredictions } from './usePredictions';
import { useCashbookCategories } from './useCashbookCategories';
import {
  buildPaydayInstances,
  buildWeeklyBuckets,
  paydayBoundaries,
  weeklyBoundaries,
  buildCashflowCards,
  buildRecurrenceOccurrences,
  recurrenceTransactions,
  recurrenceBoundaries,
  mergeBoundariesByDate,
  recurrenceMonthKey,
  llmTransactions,
  type CashflowCardData,
  type CashflowTransaction,
  type LlmPrediction,
} from '@/utils/cashflow';
import { estimateVariableDaily } from '@/utils/auto-detect';
import { DEFAULT_CASHFLOW_VARIABLE_MODE, type CashflowSettings } from '@/types';

/** 캘린더 표시 기간(개월). 다음 결제일부터 N개월. */
export const CASHFLOW_HORIZON_MONTHS = 3;

export type CashflowCalendarResult = {
  cards: CashflowCardData[];
  settings: CashflowSettings | null;
  /** 결제일이 1개 이상 등록됐는지(아니면 주 단위 폴백). */
  hasPaydays: boolean;
  /** 설정 문서가 존재하는지(없으면 설정 안내 화면). */
  isConfigured: boolean;
  isLoading: boolean;
};

/**
 * 미래 확정거래(cashbookEntries) + 미확정 예측(predicted) + 설정을 합성해
 * 결제일별 카드(들어올/나갈/남는 돈 누적)를 만든다.
 * - 캘린더 잔액은 actual entry + 'predicted' prediction만 합산(confirmed/rejected 제외) → 이중계산 방지.
 */
export function useCashflowCalendar(
  coupleId: string | null,
  llmPredictions: LlmPrediction[] = []
): CashflowCalendarResult {
  const from = useMemo(() => dayjs().startOf('day'), []);
  const horizonEnd = useMemo(() => from.add(CASHFLOW_HORIZON_MONTHS, 'month').endOf('day'), [from]);

  const { data: settings, isLoading: settingsLoading } = useCashflowSettings(coupleId);
  const { data: entries, isLoading: entriesLoading } = useCashbookEntriesInRange(
    coupleId,
    from.toDate(),
    horizonEnd.toDate()
  );
  const { data: predictions, isLoading: predictionsLoading } = useActivePredictions(
    coupleId,
    from.toDate()
  );
  const { data: categories } = useCashbookCategories(coupleId);

  // §7-2 변동지출 추정용 과거 내역 (variableMode개월)
  const variableMode = settings?.variableMode ?? DEFAULT_CASHFLOW_VARIABLE_MODE;
  const pastFrom = useMemo(
    () => from.subtract(variableMode, 'month').toDate(),
    [from, variableMode]
  );
  const { data: pastEntries } = useCashbookEntriesInRange(coupleId, pastFrom, from.toDate());
  const estimatedDailyVariable = useMemo(
    () => estimateVariableDaily(pastEntries ?? [], variableMode),
    [pastEntries, variableMode]
  );

  const cards = useMemo<CashflowCardData[]>(() => {
    const currentCash = settings?.currentCash ?? 0;
    const paydays = settings?.paydays ?? [];

    // Phase 2: 카드 경계 = recurrence 발생일(체크포인트) + 레거시 결제일(있으면) 병합.
    // 둘 다 없으면 주 단위 폴백. (수동 결제일 입력 UI는 폐지됐고, 기존 데이터는 경계로만 잔존.)
    const occurrences = buildRecurrenceOccurrences(categories ?? [], {
      from,
      months: CASHFLOW_HORIZON_MONTHS,
    });
    const recurB = recurrenceBoundaries(occurrences);
    const paydayB =
      paydays.length > 0
        ? paydayBoundaries(buildPaydayInstances(paydays, from, CASHFLOW_HORIZON_MONTHS))
        : [];
    const merged = mergeBoundariesByDate(paydayB, recurB);
    const boundaries =
      merged.length > 0
        ? merged
        : weeklyBoundaries(buildWeeklyBuckets(from, CASHFLOW_HORIZON_MONTHS));

    const txns: CashflowTransaction[] = [];
    for (const e of entries ?? []) {
      txns.push({
        id: e.id,
        kind: 'actual',
        type: e.type,
        amount: e.amount,
        category: e.category,
        description: e.description,
        date: e.date.toDate(),
      });
    }
    for (const p of predictions ?? []) {
      txns.push({
        id: p.id,
        kind: 'predicted',
        type: p.type,
        amount: p.amount,
        category: p.category,
        description: p.description,
        date: p.date.toDate(),
        source: p.source,
      });
    }

    // recurrence(고정 지출/수입 정기 발생)를 합성 예측으로 합친다(이중계산 방지 게이트 적용).
    // - G1: 실거래(미래 horizon + 최근 과거)가 있는 달은 제외 → 그 달은 실거래로만 계산.
    // - G2: 이미 활성 예측이 잡힌 달은 제외 → 캘린더/자동감지 예측과 중복 방지.
    const actualKeys = new Set<string>();
    for (const e of entries ?? []) actualKeys.add(recurrenceMonthKey(e.category, e.date.toDate()));
    for (const e of pastEntries ?? [])
      actualKeys.add(recurrenceMonthKey(e.category, e.date.toDate()));
    const activePredictionKeys = new Set<string>();
    for (const p of predictions ?? [])
      activePredictionKeys.add(recurrenceMonthKey(p.category, p.date.toDate()));

    for (const t of recurrenceTransactions(occurrences, { actualKeys, activePredictionKeys })) {
      txns.push(t);
    }

    // LLM 예측(표시 전용, 잔액 미반영). 정기 발생 선언 카테고리만 제외(이미 ◇로 노출).
    // 표시 전용이라 잔액 이중계산 우려가 없어 "같은 달 실거래" 게이트(G1)는 적용하지 않는다.
    const declaredCategories = new Set<string>();
    for (const c of categories ?? []) {
      if (c.recurrence?.enabled) declaredCategories.add(c.name);
    }
    for (const t of llmTransactions(llmPredictions, {
      from,
      months: CASHFLOW_HORIZON_MONTHS,
      declaredCategories,
    })) {
      txns.push(t);
    }

    return buildCashflowCards(boundaries, txns, currentCash, {
      from: from.toDate(),
      estimatedDailyVariable,
    });
  }, [
    settings,
    entries,
    predictions,
    pastEntries,
    categories,
    from,
    estimatedDailyVariable,
    llmPredictions,
  ]);

  return {
    cards,
    settings: settings ?? null,
    hasPaydays: (settings?.paydays?.length ?? 0) > 0,
    isConfigured: !!settings,
    isLoading: settingsLoading || entriesLoading || predictionsLoading,
  };
}
