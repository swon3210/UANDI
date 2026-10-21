import { useMemo } from 'react';
import { experimental_streamedQuery as streamedQuery, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { buildFixedLookup, filterEntries } from '@/hooks/useDashboardData';
import { useMonthWindowEntries } from '@/hooks/useMonthlyMedianComparison';
import { streamCategoryAnalysis, type CategoryAnalysisParams } from '@/services/ai';
import type { CashbookEntry } from '@/types';
import type { CategoryAnalysisParams as PageParams } from '@/utils/category-analysis';
import { categoryMedian } from '@/utils/median-comparison';

export type CategoryMonthPoint = {
  cursor: Dayjs;
  amount: number;
  count: number;
  /** 기준 달이면 true */
  isCurrent: boolean;
};

export type CategoryAnalysisData = {
  /** 기준 달 이 카테고리 내역 (최신순) */
  entries: CashbookEntry[];
  currentAmount: number;
  /** 평소(중위값). 표본 부족이면 null */
  median: number | null;
  sampleMonths: number;
  /** 오래된 달 → 기준 달 순 */
  points: CategoryMonthPoint[];
};

/** AI 요청 바디 상한 (내역은 금액 큰 순으로 자른다) */
const MAX_AI_ENTRIES = 100;

function toDate(value: CashbookEntry['date']): Date {
  return value instanceof Date ? value : value.toDate();
}

/**
 * 한 카테고리의 기준 달 내역·평소(중위값)·월별 추이를 만든다.
 * 그룹·세부 필터는 대시보드와 같은 기준(`filterEntries`)으로 먼저 적용한다.
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
  const categoriesQuery = useCashbookCategories(coupleId);
  const isLoading = params !== null && (isMonthsLoading || categoriesQuery.isLoading);

  const data = useMemo<CategoryAnalysisData | null>(() => {
    if (!params || isLoading) return null;
    if (months.some((entries) => entries === undefined)) return null;
    const fixedLookup = buildFixedLookup(categoriesQuery.data);
    const filtered = months.map((entries) =>
      filterEntries(entries ?? [], params.group, params.subGroup, fixedLookup)
    );
    const [current, ...previous] = filtered;
    const ofCategory = (entries: CashbookEntry[]) =>
      entries.filter((e) => e.category === params.category);

    const currentEntries = ofCategory(current).sort(
      (a, b) => toDate(b.date).getTime() - toDate(a.date).getTime()
    );
    const { median, sampleMonths } = categoryMedian(previous, params.category);
    const points = filtered
      .map((entries, i) => {
        const mine = ofCategory(entries);
        return {
          cursor: cursors[i],
          amount: mine.reduce((sum, e) => sum + e.amount, 0),
          count: mine.length,
          isCurrent: i === 0,
        };
      })
      .reverse();

    return {
      entries: currentEntries,
      currentAmount: currentEntries.reduce((sum, e) => sum + e.amount, 0),
      median,
      sampleMonths,
      points,
    };
  }, [params, isLoading, months, cursors, categoriesQuery.data]);

  return { data, isLoading };
}

/** 페이지 데이터 → AI 요청 바디 */
export function toCategoryAnalysisRequest(
  params: PageParams,
  data: CategoryAnalysisData
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
      amount: e.amount,
      description: e.description ?? '',
    }));
  return {
    category: params.category,
    group: params.group,
    year: params.cursor.year(),
    month: params.cursor.month() + 1,
    current: { amount: data.currentAmount, count: data.entries.length, entries },
    history,
    median: data.median,
  };
}

/**
 * 카테고리 AI 보고서. 데이터가 준비되면 자동으로 스트리밍을 시작하고 청크를 문자열로 누적한다.
 * 같은 카테고리·달은 캐시를 다시 써서(staleTime 무한) 뒤로 갔다 와도 한도를 소모하지 않는다.
 */
export function useCategoryAnalysisReport(
  coupleId: string | null,
  params: PageParams | null,
  data: CategoryAnalysisData | null
) {
  const enabled = !!coupleId && params !== null && data !== null;
  return useQuery({
    queryKey: [
      'categoryAnalysis',
      coupleId,
      params?.group,
      params?.subGroup,
      params?.category,
      params?.cursor.format('YYYY-MM'),
    ],
    queryFn: streamedQuery({
      streamFn: () => streamCategoryAnalysis(toCategoryAnalysisRequest(params!, data!)),
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
