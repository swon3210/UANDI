import { useMemo } from 'react';
import {
  experimental_streamedQuery as streamedQuery,
  useQuery,
  type QueryKey,
} from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { cashbookEntriesInRangeOptions } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { buildFixedLookup, filterEntries } from '@/hooks/useDashboardData';
import { useMonthWindowEntries } from '@/hooks/useMonthlyMedianComparison';
import { streamCategoryAnalysis, type CategoryAnalysisParams } from '@/services/ai';
import type { CashbookEntry } from '@/types';
import type { CategoryAnalysisParams as PageParams } from '@/utils/category-analysis';
import { getPeriodLabel } from '@/utils/date';
import {
  categoryMedians,
  medianSamples,
  MEDIAN_WINDOW_MONTHS,
  selectionMedian,
} from '@/utils/median-comparison';

export type CategoryMonthPoint = {
  cursor: Dayjs;
  amount: number;
  count: number;
  /** 기준 달이면 true */
  isCurrent: boolean;
};

export type CategoryAnalysisRow = {
  category: string;
  /** 기준 달 금액 */
  current: number;
  /** 비교 대상(그 달 또는 평소) 금액. 평소 표본이 부족하면 null */
  compare: number | null;
  /** 기준 달 건수 */
  count: number;
};

/** 추이 차트 카테고리 필터용: 한 카테고리의 월 금액과 평소 */
export type CategoryTrend = {
  category: string;
  /** `points`와 같은 순서(오래된 달 → 기준 달)의 월 금액 */
  amounts: number[];
  /** 그 카테고리의 평소(중위값). 표본 부족이면 null */
  median: number | null;
};

export type CategoryAnalysisData = {
  /** 분석 범위의 카테고리별 금액 (이번 달 → 비교 대상 금액 내림차순) */
  rows: CategoryAnalysisRow[];
  /** 기준 달 분석 범위 내역 (최신순) */
  entries: CashbookEntry[];
  currentAmount: number;
  /** 비교 대상 합계. 평소 표본이 부족하면 null */
  compareAmount: number | null;
  /** 평소(묶음 합계의 중위값). 표본 부족이면 null — 추이 차트 점선용 */
  median: number | null;
  sampleMonths: number;
  /** 분석 범위 묶음의 월 합계, 오래된 달 → 기준 달 순 */
  points: CategoryMonthPoint[];
  /** `rows`와 같은 순서의 카테고리별 추이 */
  trends: CategoryTrend[];
  /**
   * 카테고리 선택 후보: 고른 것과 상관없이 범위(그룹·세부 필터) 안에서 이번 달이나 비교 대상에
   * 금액이 있는 카테고리 + 지금 고른 카테고리. 이번 달 금액 내림차순
   */
  scopeCategories: string[];
};

/** AI 요청 바디 상한 (내역은 금액 큰 순, 카테고리는 이번 달 금액 순으로 자른다) */
const MAX_AI_ENTRIES = 100;
const MAX_AI_CATEGORIES = 30;

function toDate(value: CashbookEntry['date']): Date {
  return value instanceof Date ? value : value.toDate();
}

function sumByCategory(entries: CashbookEntry[]): Map<string, { amount: number; count: number }> {
  const sums = new Map<string, { amount: number; count: number }>();
  for (const e of entries) {
    const prev = sums.get(e.category) ?? { amount: 0, count: 0 };
    sums.set(e.category, { amount: prev.amount + e.amount, count: prev.count + 1 });
  }
  return sums;
}

/**
 * 고른 카테고리 묶음(없으면 그룹·세부 필터 범위 전체)의 기준 달 내역·비교 대상·월별 추이를 만든다.
 * 그룹·세부 필터는 대시보드와 같은 기준(`filterEntries`)으로 먼저 적용한다.
 * 비교 달이 최근 6개월 밖이면 그 달만 따로 조회한다 (대시보드와 같은 쿼리 키라 캐시를 같이 쓴다).
 */
export function useCategoryAnalysisData(
  coupleId: string | null,
  params: PageParams | null
): { data: CategoryAnalysisData | null; isLoading: boolean } {
  const cursor = params?.cursor ?? dayjs().startOf('month');
  const {
    months,
    cursors,
    isLoading: isMonthsLoading,
  } = useMonthWindowEntries(coupleId, cursor, params !== null);
  const compareMonth = params && params.compare !== 'median' ? params.compare : null;
  const compareQuery = useQuery({
    ...cashbookEntriesInRangeOptions(
      coupleId,
      (compareMonth ?? cursor).startOf('month').toDate(),
      (compareMonth ?? cursor).endOf('month').toDate()
    ),
    enabled: !!coupleId && compareMonth !== null,
  });
  const categoriesQuery = useCashbookCategories(coupleId);
  const isLoading =
    params !== null &&
    (isMonthsLoading ||
      categoriesQuery.isLoading ||
      (compareMonth !== null && compareQuery.isLoading));

  const data = useMemo<CategoryAnalysisData | null>(() => {
    if (!params || isLoading) return null;
    if (months.some((entries) => entries === undefined)) return null;
    const fixedLookup = buildFixedLookup(categoriesQuery.data);
    const scoped = (entries: CashbookEntry[]) =>
      filterEntries(entries, params.group, params.subGroup, fixedLookup);
    const selected = params.categories.length > 0 ? new Set(params.categories) : null;
    const inSelection = (entries: CashbookEntry[]) =>
      selected ? entries.filter((e) => selected.has(e.category)) : entries;

    const filtered = months.map((entries) => inSelection(scoped(entries ?? [])));
    const [current, ...previous] = filtered;
    const samples = medianSamples(previous.map((entries) => scoped(entries ?? [])));
    const median = samples ? selectionMedian(samples, selected ? params.categories : null) : null;

    // 비교 대상의 카테고리별 금액
    let compareByCategory: Map<string, number> | null;
    let compareAmount: number | null;
    if (compareMonth) {
      const compareEntries = inSelection(scoped(compareQuery.data ?? []));
      compareByCategory = new Map(
        [...sumByCategory(compareEntries)].map(([name, s]) => [name, s.amount])
      );
      compareAmount = compareEntries.reduce((sum, e) => sum + e.amount, 0);
    } else {
      compareByCategory = samples ? categoryMedians(samples) : null;
      compareAmount = median;
    }

    const currentByCategory = sumByCategory(current);

    const scopeCurrent = sumByCategory(scoped(months[0] ?? []));
    const scopeNames = new Set<string>([...scopeCurrent.keys(), ...params.categories]);
    if (compareMonth) {
      for (const e of scoped(compareQuery.data ?? [])) scopeNames.add(e.category);
    } else if (samples) {
      for (const [name, amount] of categoryMedians(samples)) if (amount > 0) scopeNames.add(name);
    }
    const scopeCategories = [...scopeNames].sort(
      (a, b) => (scopeCurrent.get(b)?.amount ?? 0) - (scopeCurrent.get(a)?.amount ?? 0)
    );
    const names = new Set<string>(selected ? params.categories : currentByCategory.keys());
    if (!selected && compareByCategory) {
      for (const [name, amount] of compareByCategory) if (amount > 0) names.add(name);
    }
    const rows = [...names]
      .map((category) => ({
        category,
        current: currentByCategory.get(category)?.amount ?? 0,
        compare: compareByCategory ? (compareByCategory.get(category) ?? 0) : null,
        count: currentByCategory.get(category)?.count ?? 0,
      }))
      .sort((a, b) => b.current - a.current || (b.compare ?? 0) - (a.compare ?? 0));

    const points = filtered
      .map((entries, i) => ({
        cursor: cursors[i],
        amount: entries.reduce((sum, e) => sum + e.amount, 0),
        count: entries.length,
        isCurrent: i === 0,
      }))
      .reverse();
    const trends = rows.map(({ category }) => ({
      category,
      amounts: filtered
        .map((entries) =>
          entries.reduce((sum, e) => (e.category === category ? sum + e.amount : sum), 0)
        )
        .reverse(),
      median: samples ? selectionMedian(samples, [category]) : null,
    }));

    return {
      rows,
      entries: [...current].sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime()),
      currentAmount: current.reduce((sum, e) => sum + e.amount, 0),
      compareAmount,
      median,
      sampleMonths: samples?.length ?? 0,
      points,
      trends,
      scopeCategories,
    };
  }, [params, isLoading, months, cursors, compareMonth, compareQuery.data, categoriesQuery.data]);

  return { data, isLoading };
}

/** 비교 대상 라벨 (예: 평소, 2026년 9월) */
export function compareTargetLabel(compare: PageParams['compare']): string {
  return compare === 'median' ? '평소' : getPeriodLabel('monthly', compare);
}

/** 페이지 데이터 → AI 요청 바디. `scope`는 분석 범위 이름(예: 식비·교통, 전체 변동 지출) */
export function toCategoryAnalysisRequest(
  params: PageParams,
  data: CategoryAnalysisData,
  scope: string
): CategoryAnalysisParams {
  const history = data.points
    .filter((p) => !p.isCurrent)
    .map((p) => ({
      year: p.cursor.year(),
      month: p.cursor.month() + 1,
      amount: p.amount,
      count: p.count,
    }));
  const entries = [...data.entries]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, MAX_AI_ENTRIES)
    .map((e) => ({
      date: dayjs(toDate(e.date)).format('YYYY-MM-DD'),
      category: e.category,
      amount: e.amount,
      description: e.description ?? '',
    }));
  return {
    group: params.group,
    scope,
    year: params.cursor.year(),
    month: params.cursor.month() + 1,
    compare: {
      label:
        params.compare === 'median'
          ? `평소(최근 ${MEDIAN_WINDOW_MONTHS}개월 중위값)`
          : compareTargetLabel(params.compare),
      amount: data.compareAmount,
    },
    current: { amount: data.currentAmount, count: data.entries.length, entries },
    categories: data.rows.slice(0, MAX_AI_CATEGORIES),
    history,
    median: data.median,
  };
}

/**
 * 분석 범위 전체에 대한 AI 종합 보고서 1개. 데이터가 준비되면 자동으로 스트리밍을 시작하고
 * 청크를 문자열로 누적한다. 같은 범위·달·비교 대상은 캐시를 다시 써서(staleTime 무한)
 * 뒤로 갔다 와도 한도를 소모하지 않는다.
 */
export function useCategoryAnalysisReport(
  coupleId: string | null,
  params: PageParams | null,
  data: CategoryAnalysisData | null,
  scope: string
) {
  const enabled = !!coupleId && params !== null && data !== null;
  const queryKey: QueryKey = [
    'categoryAnalysis',
    coupleId,
    params?.group,
    params?.subGroup,
    [...(params?.categories ?? [])].sort().join('|'),
    params?.cursor.format('YYYY-MM'),
    params?.compare === 'median' ? 'median' : params?.compare.format('YYYY-MM'),
  ];
  return useQuery({
    queryKey,
    queryFn: streamedQuery({
      streamFn: () => streamCategoryAnalysis(toCategoryAnalysisRequest(params!, data!, scope)),
      reducer: (acc: string, chunk: string) => acc + chunk,
      initialValue: '',
    }),
    enabled,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
