'use client';

import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useCashflowSettings } from './useCashflowSettings';
import { useCashbookEntriesInRange } from './useCashbook';
import { useActivePredictions } from './usePredictions';
import {
  buildPaydayInstances,
  buildWeeklyBuckets,
  paydayBoundaries,
  weeklyBoundaries,
  buildCashflowCards,
  type CashflowCardData,
  type CashflowTransaction,
} from '@/utils/cashflow';
import type { CashflowSettings } from '@/types';

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
export function useCashflowCalendar(coupleId: string | null): CashflowCalendarResult {
  const from = useMemo(() => dayjs().startOf('day'), []);
  const horizonEnd = useMemo(
    () => from.add(CASHFLOW_HORIZON_MONTHS, 'month').endOf('day'),
    [from]
  );

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

  const cards = useMemo<CashflowCardData[]>(() => {
    const currentCash = settings?.currentCash ?? 0;
    const paydays = settings?.paydays ?? [];

    const boundaries =
      paydays.length > 0
        ? paydayBoundaries(buildPaydayInstances(paydays, from, CASHFLOW_HORIZON_MONTHS))
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

    return buildCashflowCards(boundaries, txns, currentCash);
  }, [settings, entries, predictions, from]);

  return {
    cards,
    settings: settings ?? null,
    hasPaydays: (settings?.paydays?.length ?? 0) > 0,
    isConfigured: !!settings,
    isLoading: settingsLoading || entriesLoading || predictionsLoading,
  };
}
