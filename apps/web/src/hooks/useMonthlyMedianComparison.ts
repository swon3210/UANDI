import { useMemo } from 'react';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { type Dayjs } from 'dayjs';
import { cashbookEntriesInRangeOptions } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import {
  buildFixedLookup,
  filterEntries,
  type CategoryComparisonRow,
  type GroupFilter,
  type PeriodComparison,
  type SubGroupFilter,
} from '@/hooks/useDashboardData';
import type { CashbookEntry } from '@/types';
import {
  categoryMedians,
  medianSamples,
  MEDIAN_WINDOW_MONTHS,
  selectionMedian,
} from '@/utils/median-comparison';

export type MonthlyMedianComparisonResult = {
  /**
   * 기준 달 vs 카테고리별 "평소"(중위값). 기간 비교 차트에 그대로 넣을 수 있는 모양이다.
   * null = 기록 있는 달이 부족해 비교할 수 없음 (로딩 중에도 null)
   */
  comparison: PeriodComparison | null;
  /** 고른 카테고리 묶음(null = 전체)의 평소 금액. 비교할 수 없으면 0 */
  medianOf: (categories: readonly string[] | null) => number;
  isLoading: boolean;
};

// 컴포넌트 밖에 두어 결과가 바뀔 때만 다시 합친다 (인라인이면 매 렌더 재실행)
function combineMonths(results: UseQueryResult<CashbookEntry[]>[]) {
  return {
    months: results.map((r) => r.data),
    isLoading: results.some((r) => r.isLoading),
  };
}

export type MonthWindowEntries = {
  /** [0] = 기준 달, [1..N] = 직전 N개월 (각 달 로딩 전엔 undefined) */
  months: (CashbookEntry[] | undefined)[];
  /** 기준 달·직전 달 각각의 1일 커서. months와 같은 순서 */
  cursors: Dayjs[];
  isLoading: boolean;
};

/**
 * 기준 달(`cursor`)과 직전 `MEDIAN_WINDOW_MONTHS`개월의 내역을 달마다 대시보드와 같은
 * 범위 쿼리 키로 조회한다 (추가 요청 없이 캐시를 함께 쓰고, 기간을 이동하며 이미 본 달도 재사용).
 * `enabled`가 false면 조회하지 않는다.
 */
export function useMonthWindowEntries(
  coupleId: string | null,
  cursor: Dayjs,
  enabled = true
): MonthWindowEntries {
  const cursors = useMemo(() => {
    const base = cursor.startOf('month');
    return Array.from({ length: MEDIAN_WINDOW_MONTHS + 1 }, (_, i) => base.subtract(i, 'month'));
  }, [cursor]);

  const { months, isLoading } = useQueries({
    queries: cursors.map((month) => ({
      ...cashbookEntriesInRangeOptions(
        coupleId,
        month.startOf('month').toDate(),
        month.endOf('month').toDate()
      ),
      enabled: !!coupleId && enabled,
    })),
    combine: combineMonths,
  });

  return { months, cursors, isLoading: enabled && isLoading };
}

/** 이번 달 금액 vs 카테고리별 평소. 어느 한쪽에라도 금액이 있는 카테고리, 이번 달 → 평소 내림차순 */
function buildMedianRows(
  current: CashbookEntry[],
  samples: CashbookEntry[][]
): CategoryComparisonRow[] {
  const rows = new Map<string, CategoryComparisonRow>();
  for (const [category, med] of categoryMedians(samples)) {
    if (med > 0) rows.set(category, { category, current: 0, compare: med });
  }
  for (const e of current) {
    const row = rows.get(e.category) ?? { category: e.category, current: 0, compare: 0 };
    row.current += e.amount;
    rows.set(e.category, row);
  }
  return [...rows.values()].sort((a, b) => b.current - a.current || b.compare - a.compare);
}

const NO_MEDIAN = () => 0;

/**
 * 기준 달의 내역을 직전 `MEDIAN_WINDOW_MONTHS`개월의 "평소"(중위값)와 비교한다.
 * 기간 비교 차트의 비교 대상을 '평소'로 골랐을 때 쓴다. `enabled`가 false면 조회하지 않는다.
 */
export function useMonthlyMedianComparison(args: {
  coupleId: string | null;
  cursor: Dayjs;
  group: GroupFilter;
  subGroup: SubGroupFilter;
  enabled: boolean;
}): MonthlyMedianComparisonResult {
  const { coupleId, cursor, group, subGroup, enabled } = args;

  const { months, isLoading: isMonthsLoading } = useMonthWindowEntries(coupleId, cursor, enabled);
  const categoriesQuery = useCashbookCategories(coupleId);

  const isLoading = enabled && (isMonthsLoading || categoriesQuery.isLoading);

  return useMemo(() => {
    const empty = { comparison: null, medianOf: NO_MEDIAN, isLoading };
    if (!enabled || isLoading) return empty;
    const [current, ...previous] = months;
    if (!current || previous.some((entries) => entries === undefined)) return empty;
    const fixedLookup = buildFixedLookup(categoriesQuery.data);
    const samples = medianSamples(
      previous.map((entries) => filterEntries(entries ?? [], group, subGroup, fixedLookup))
    );
    if (!samples) return empty;
    return {
      comparison: {
        rows: buildMedianRows(filterEntries(current, group, subGroup, fixedLookup), samples),
      },
      medianOf: (categories: readonly string[] | null) => selectionMedian(samples, categories),
      isLoading,
    };
  }, [enabled, isLoading, months, categoriesQuery.data, group, subGroup]);
}
