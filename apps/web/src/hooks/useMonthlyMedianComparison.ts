import { useMemo } from 'react';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { type Dayjs } from 'dayjs';
import { cashbookEntriesInRangeOptions } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import {
  buildFixedLookup,
  filterEntries,
  type GroupFilter,
  type SubGroupFilter,
} from '@/hooks/useDashboardData';
import type { CashbookEntry } from '@/types';
import {
  buildMedianComparison,
  MEDIAN_WINDOW_MONTHS,
  type MedianComparison,
} from '@/utils/median-comparison';

export type MonthlyMedianComparisonResult = {
  /** null = 기록 있는 달이 부족해 비교할 수 없음 (로딩 중에도 null) */
  comparison: MedianComparison | null;
  isLoading: boolean;
};

// 컴포넌트 밖에 두어 결과가 바뀔 때만 다시 합친다 (인라인이면 매 렌더 재실행)
function combineMonths(results: UseQueryResult<CashbookEntry[]>[]) {
  return {
    months: results.map((r) => r.data),
    isLoading: results.some((r) => r.isLoading),
  };
}

/**
 * 기준 달(`cursor`)의 내역을 직전 `MEDIAN_WINDOW_MONTHS`개월의 "평소"(중위값)와 비교한다.
 * 기준 달과 지난 달들을 대시보드와 같은 범위 쿼리 키로 조회해 추가 요청 없이 캐시를 함께 쓰고,
 * 기간을 이동하며 이미 본 달도 다시 쓴다. `enabled`가 false(연간 탭 등)면 조회하지 않는다.
 */
export function useMonthlyMedianComparison(args: {
  coupleId: string | null;
  cursor: Dayjs;
  group: GroupFilter;
  subGroup: SubGroupFilter;
  enabled: boolean;
}): MonthlyMedianComparisonResult {
  const { coupleId, cursor, group, subGroup, enabled } = args;

  // [0] = 기준 달, [1..N] = 직전 N개월
  const monthRanges = useMemo(() => {
    const base = cursor.startOf('month');
    return Array.from({ length: MEDIAN_WINDOW_MONTHS + 1 }, (_, i) => {
      const month = base.subtract(i, 'month');
      return { start: month.startOf('month').toDate(), end: month.endOf('month').toDate() };
    });
  }, [cursor]);

  const { months, isLoading: isMonthsLoading } = useQueries({
    queries: monthRanges.map(({ start, end }) => ({
      ...cashbookEntriesInRangeOptions(coupleId, start, end),
      enabled: !!coupleId && enabled,
    })),
    combine: combineMonths,
  });
  const categoriesQuery = useCashbookCategories(coupleId);

  const isLoading = enabled && (isMonthsLoading || categoriesQuery.isLoading);

  const comparison = useMemo(() => {
    if (!enabled || isLoading) return null;
    const [current, ...previous] = months;
    if (!current || previous.some((entries) => entries === undefined)) return null;
    const fixedLookup = buildFixedLookup(categoriesQuery.data);
    return buildMedianComparison(
      filterEntries(current, group, subGroup, fixedLookup),
      previous.map((entries) => filterEntries(entries ?? [], group, subGroup, fixedLookup))
    );
  }, [enabled, isLoading, months, categoriesQuery.data, group, subGroup]);

  return { comparison, isLoading };
}
