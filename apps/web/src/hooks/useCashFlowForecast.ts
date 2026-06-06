import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { CashFlowPoint } from '@uandi/ui';
import { useCashbookEntriesInRange } from '@/hooks/useCashbook';
import type { CashbookEntry } from '@/types';

// 과거(현재 달 포함) 표시 개월 수 + 미래 예측 개월 수
const PAST_MONTHS = 6;
const FUTURE_MONTHS = 3;

export type CashFlowForecast = {
  points: CashFlowPoint[];
  hasHistory: boolean;
  isLoading: boolean;
};

// 순현금흐름 = 수입 - 지출. flex는 제외(useDashboardData의 'all' 순잔액 규칙과 일치).
function netOf(entries: CashbookEntry[]): number {
  let income = 0;
  let expense = 0;
  for (const e of entries) {
    if (e.type === 'income') income += e.amount;
    else if (e.type === 'expense') expense += e.amount;
  }
  return income - expense;
}

/**
 * 최근 PAST_MONTHS개월(현재 달 포함)의 월별 순현금흐름 + 향후 FUTURE_MONTHS개월 예측을 계산한다.
 * 예측값은 완료된 과거 달(현재 달 제외)의 net 평균(baseline)으로 평탄하게 적용한다.
 * 미래 구간은 추가 조회 없이 in-memory로 계산한다.
 */
export function useCashFlowForecast(coupleId: string | null): CashFlowForecast {
  // queryKey 안정성을 위해 now를 한 번만 고정한다.
  const now = useMemo(() => dayjs(), []);
  const { start, end } = useMemo(
    () => ({
      start: now.subtract(PAST_MONTHS - 1, 'month').startOf('month').toDate(),
      end: now.endOf('month').toDate(),
    }),
    [now]
  );

  const entriesQuery = useCashbookEntriesInRange(coupleId, start, end);

  return useMemo(() => {
    const entries = entriesQuery.data ?? [];

    // 월별('YYYY-MM')로 묶어 순흐름 집계
    const bucket = new Map<string, CashbookEntry[]>();
    for (const e of entries) {
      const key = dayjs(e.date.toDate()).format('YYYY-MM');
      const list = bucket.get(key) ?? [];
      list.push(e);
      bucket.set(key, list);
    }
    const netByMonth = new Map<string, number>();
    for (const [key, list] of bucket.entries()) {
      netByMonth.set(key, netOf(list));
    }

    // 과거(현재 포함) PAST_MONTHS개월 actual 슬롯 (오래된 → 최신 순)
    const actualMonths = Array.from({ length: PAST_MONTHS }, (_, i) => {
      const m = now.subtract(PAST_MONTHS - 1 - i, 'month');
      return { month: m.month() + 1, net: netByMonth.get(m.format('YYYY-MM')) ?? 0 };
    });

    // baseline = 완료된 달(현재 달 제외)의 net 평균. 내역 0인 달도 net=0으로 평균에 포함.
    const completed = actualMonths.slice(0, PAST_MONTHS - 1);
    const baseline =
      completed.length > 0
        ? Math.round(completed.reduce((s, c) => s + c.net, 0) / completed.length)
        : 0;

    const points: CashFlowPoint[] = actualMonths.map((slot, idx) => ({
      month: slot.month,
      actual: slot.net,
      // 현재 달(경계)만 forecast를 actual과 동일하게 채워 점선이 실선 끝점에서 이어지게 함
      forecast: idx === PAST_MONTHS - 1 ? slot.net : null,
    }));

    for (let k = 1; k <= FUTURE_MONTHS; k++) {
      const m = now.add(k, 'month');
      points.push({ month: m.month() + 1, actual: null, forecast: baseline });
    }

    return {
      points,
      hasHistory: entries.length > 0,
      isLoading: entriesQuery.isLoading,
    };
  }, [entriesQuery.data, entriesQuery.isLoading, now]);
}
