import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  getMonthlyEntries,
  getEntriesInRange,
  addEntry,
  addEntries,
  updateEntry,
  deleteEntry,
} from '@/services/cashbook';
import type { CashbookEntry, CashbookEntryType } from '@/types';

export type EntryFilterType = CashbookEntryType | 'all';

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
  typeFilter: EntryFilterType;
  selectedCategoryNames: string[];
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
    typeFilter: 'all',
    selectedCategoryNames: [],
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

export function useFilteredEntries(
  entries: CashbookEntry[] | undefined,
  typeFilter: EntryFilterType,
  selectedCategoryNames: string[],
  keyword: string = ''
): CashbookEntry[] {
  return useMemo(() => {
    if (!entries) return [];
    const kw = keyword.trim().toLowerCase();
    return entries.filter((entry) => {
      if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
      if (selectedCategoryNames.length > 0 && !selectedCategoryNames.includes(entry.category)) {
        return false;
      }
      if (kw && !`${entry.description} ${entry.category}`.toLowerCase().includes(kw)) {
        return false;
      }
      return true;
    });
  }, [entries, typeFilter, selectedCategoryNames, keyword]);
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
