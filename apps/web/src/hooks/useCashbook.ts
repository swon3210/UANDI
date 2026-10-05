import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  getMonthlyEntries,
  getEntriesInRange,
  getLatestEntryDate,
  addEntry,
  addEntries,
  updateEntry,
  deleteEntry,
} from '@/services/cashbook';
import type { CashbookEntry, CashbookEntryType } from '@/types';
import { buildCategoryHints, type CategoryHint } from '@/utils/category-hints';

/** 필터 시트의 기간 프리셋 버튼 값 (UI 표현). */
export type PeriodPreset = 'thisMonth' | 'lastMonth' | 'last3Months' | 'thisYear' | 'custom';

/** 내역 정렬 기준: 날짜(최신/오래된) + 금액(높은/낮은). */
export type EntrySort = 'latest' | 'oldest' | 'amountDesc' | 'amountAsc';

/** 날짜 기준 정렬이면 true(날짜 그룹 렌더), 금액 기준이면 false(평면 목록). */
export function isDateSort(sort: EntrySort): boolean {
  return sort === 'latest' || sort === 'oldest';
}

/**
 * 조회 기간 상태. `month` 모드는 인라인 월 이동 스테퍼와 이번달/지난달 프리셋이 공유한다.
 * 나머지 모드는 여러 달에 걸친 범위.
 */
export type PeriodSelection =
  | { mode: 'month'; year: number; month: number } // month: 0-based
  | { mode: 'last3Months' }
  | { mode: 'thisYear' }
  | { mode: 'custom'; start: string; end: string }; // 'YYYY-MM-DD'

export type CashbookFilterState = {
  period: PeriodSelection;
  /** 선택된 타입(지출/수입/flex). 빈 배열 = 전체(타입 무필터). 다중 선택 가능. */
  selectedTypes: CashbookEntryType[];
  selectedCategoryNames: string[];
  /** 선택된 작성자 uid. 빈 배열 = 전체(작성자 무필터). 다중 선택 가능. */
  selectedCreatorUids: string[];
  keyword: string;
  sort: EntrySort;
};

/**
 * 기본 필터 상태: 이번 달 + 무필터 + 최신순.
 * 리셋/초기화 시점의 '현재 달'을 반영하도록 상수가 아닌 함수로 제공한다.
 */
export function createDefaultFilterState(): CashbookFilterState {
  const now = dayjs();
  return {
    period: { mode: 'month', year: now.year(), month: now.month() },
    selectedTypes: [],
    selectedCategoryNames: [],
    selectedCreatorUids: [],
    keyword: '',
    sort: 'latest',
  };
}

const QUERY_KEY = 'cashbookEntries';

export function useCashbookEntries(coupleId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId, year, month],
    queryFn: () => getMonthlyEntries(coupleId!, year, month),
    enabled: !!coupleId,
  });
}

export function useMonthlyEntries(coupleId: string | null) {
  const now = dayjs();
  return useCashbookEntries(coupleId, now.year(), now.month());
}

export function useCashbookEntriesInRange(coupleId: string | null, start: Date, end: Date) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId, 'range', start.toISOString(), end.toISOString()],
    queryFn: () => getEntriesInRange(coupleId!, start, end),
    enabled: !!coupleId,
  });
}

/**
 * AI 파싱 결과의 (min date - 1) ~ (max date + 1) 범위 내역을 조회한다.
 * 중복 감지에서 사용. parsed가 비어있으면 쿼리하지 않는다.
 */
export function useDuplicateScopeEntries(
  coupleId: string | null,
  parsedDates: string[]
): CashbookEntry[] {
  const range = useMemo(() => {
    if (parsedDates.length === 0) return null;
    const dates = parsedDates.map((d) => dayjs(d));
    const min = dates.reduce((a, b) => (a.isBefore(b) ? a : b)).subtract(1, 'day');
    const max = dates.reduce((a, b) => (a.isAfter(b) ? a : b)).add(1, 'day');
    return { start: min.startOf('day').toDate(), end: max.endOf('day').toDate() };
  }, [parsedDates]);

  const query = useQuery({
    queryKey: [
      QUERY_KEY,
      coupleId,
      'duplicate-scope',
      range?.start.toISOString(),
      range?.end.toISOString(),
    ],
    queryFn: () => getEntriesInRange(coupleId!, range!.start, range!.end),
    enabled: !!coupleId && !!range,
  });

  return query.data ?? [];
}

/** 카테고리 힌트로 볼 과거 내역 기간(개월). 기준점은 "마지막 내역 날짜". */
export const CATEGORY_HINT_MONTHS = 3;

/**
 * AI 파싱용 "설명 → 카테고리" 힌트.
 * 가장 최근 내역의 날짜를 기준으로 그 이전 CATEGORY_HINT_MONTHS개월 내역에서 만든다.
 * 오늘 기준이 아니라서 입력이 오래 끊긴 뒤 다시 쓰기 시작해도 과거 패턴을 그대로 참고한다.
 */
export function categoryHintsQueryOptions(coupleId: string | null) {
  return queryOptions({
    queryKey: [QUERY_KEY, coupleId, 'category-hints', CATEGORY_HINT_MONTHS],
    queryFn: async (): Promise<CategoryHint[]> => {
      const latest = await getLatestEntryDate(coupleId!);
      if (!latest) return [];
      const end = dayjs(latest).endOf('day');
      const start = end.subtract(CATEGORY_HINT_MONTHS, 'month').startOf('day');
      const entries = await getEntriesInRange(coupleId!, start.toDate(), end.toDate());
      return buildCategoryHints(entries);
    },
    enabled: !!coupleId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryHints(coupleId: string | null) {
  return useQuery(categoryHintsQueryOptions(coupleId));
}

/**
 * 제출 시점에 힌트를 확실히 확보하는 함수를 돌려준다(캐시에 있으면 즉시, 없으면 로드 후).
 * 시트를 열고 바로 제출해도 힌트가 빠지지 않게 하기 위함. 로드 실패 시 빈 배열로 진행한다.
 */
export function useResolveCategoryHints(coupleId: string | null) {
  const qc = useQueryClient();
  return async (): Promise<CategoryHint[]> => {
    if (!coupleId) return [];
    try {
      return await qc.ensureQueryData(categoryHintsQueryOptions(coupleId));
    } catch {
      return [];
    }
  };
}

export type MonthlySummary = {
  income: number;
  expense: number;
  balance: number;
};

export function useMonthlySummary(entries: CashbookEntry[] | undefined): MonthlySummary {
  return useMemo(() => {
    if (!entries || entries.length === 0) {
      return { income: 0, expense: 0, balance: 0 };
    }

    let income = 0;
    let expense = 0;
    for (const entry of entries) {
      if (entry.type === 'income') {
        income += entry.amount;
      } else {
        expense += entry.amount;
      }
    }

    return { income, expense, balance: income - expense };
  }, [entries]);
}

export type GroupedEntries = {
  date: Date;
  entries: CashbookEntry[];
};

/** 클라이언트 사이드 좁히기 조건. 각 배열은 빈 배열이면 해당 조건 무시(전체). */
export type EntryFilterCriteria = Pick<
  CashbookFilterState,
  'selectedTypes' | 'selectedCategoryNames' | 'selectedCreatorUids' | 'keyword'
>;

export function useFilteredEntries(
  entries: CashbookEntry[] | undefined,
  { selectedTypes, selectedCategoryNames, selectedCreatorUids, keyword = '' }: EntryFilterCriteria
): CashbookEntry[] {
  return useMemo(() => {
    if (!entries) return [];
    const kw = keyword.trim().toLowerCase();
    return entries.filter((entry) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(entry.type)) return false;
      if (selectedCategoryNames.length > 0 && !selectedCategoryNames.includes(entry.category)) {
        return false;
      }
      if (selectedCreatorUids.length > 0 && !selectedCreatorUids.includes(entry.createdBy)) {
        return false;
      }
      if (kw && !`${entry.description} ${entry.category}`.toLowerCase().includes(kw)) {
        return false;
      }
      return true;
    });
  }, [entries, selectedTypes, selectedCategoryNames, selectedCreatorUids, keyword]);
}

export function useGroupedEntries(
  entries: CashbookEntry[] | undefined,
  sort: EntrySort = 'latest'
): GroupedEntries[] {
  return useMemo(() => {
    if (!entries || entries.length === 0) return [];

    // 금액 기준: 날짜 그룹 없이 단일 평면 그룹으로 반환(렌더 시 날짜 헤더 숨김).
    if (sort === 'amountDesc' || sort === 'amountAsc') {
      const dir = sort === 'amountDesc' ? -1 : 1;
      const flat = [...entries].sort((a, b) => (a.amount - b.amount) * dir);
      return [{ date: flat[0].date.toDate(), entries: flat }];
    }

    // 날짜 기준: 날짜별 그룹 + 그룹/항목 모두 방향에 맞춰 정렬.
    const groups = new Map<string, CashbookEntry[]>();
    for (const entry of entries) {
      const d = entry.date.toDate();
      const key = dayjs(d).format('YYYY-MM-DD');
      const list = groups.get(key) ?? [];
      list.push(entry);
      groups.set(key, list);
    }

    const dir = sort === 'latest' ? -1 : 1;
    return Array.from(groups.entries())
      .map(([key, items]) => ({
        date: dayjs(key).toDate(),
        entries: [...items].sort(
          (a, b) => (a.date.toDate().getTime() - b.date.toDate().getTime()) * dir
        ),
      }))
      .sort((a, b) => (a.date.getTime() - b.date.getTime()) * dir);
  }, [entries, sort]);
}

export function useAddEntry(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'> & Record<string, unknown>
    ) => addEntry(coupleId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
    onError: () => toast.error('내역 추가에 실패했어요. 다시 시도해주세요.'),
  });
}

export function useAddEntries(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      entries: Array<Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'> & Record<string, unknown>>
    ) => addEntries(coupleId!, entries),
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] });
      toast.success(`${count}건 추가됐어요`);
    },
    onError: () => toast.error('내역 추가에 실패했어요. 다시 시도해주세요.'),
  });
}

export function useUpdateEntry(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      data,
    }: {
      entryId: string;
      data: Partial<Pick<CashbookEntry, 'type' | 'amount' | 'category' | 'description' | 'date'>>;
    }) => updateEntry(coupleId!, entryId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
    onError: () => toast.error('내역 수정에 실패했어요. 다시 시도해주세요.'),
  });
}

export function useDeleteEntry(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => deleteEntry(coupleId!, entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
    onError: () => toast.error('내역 삭제에 실패했어요. 다시 시도해주세요.'),
  });
}
