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

const QUERY_KEY = 'cashbookEntries';

export function useCashbookEntries(
  coupleId: string | null,
  year: number,
  month: number
) {
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

export function useCashbookEntriesInRange(
  coupleId: string | null,
  start: Date,
  end: Date
) {
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
  selectedCategoryNames: string[]
): CashbookEntry[] {
  return useMemo(() => {
    if (!entries) return [];
    return entries.filter((entry) => {
      if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
      if (selectedCategoryNames.length > 0 && !selectedCategoryNames.includes(entry.category)) {
        return false;
      }
      return true;
    });
  }, [entries, typeFilter, selectedCategoryNames]);
}

export function useGroupedEntries(
  entries: CashbookEntry[] | undefined
): GroupedEntries[] {
  return useMemo(() => {
    if (!entries || entries.length === 0) return [];

    const groups = new Map<string, CashbookEntry[]>();
    for (const entry of entries) {
      const d = entry.date.toDate();
      const key = dayjs(d).format('YYYY-MM-DD');
      const list = groups.get(key) ?? [];
      list.push(entry);
      groups.set(key, list);
    }

    return Array.from(groups.entries())
      .map(([key, items]) => ({ date: dayjs(key).toDate(), entries: items }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [entries]);
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
      data: Partial<
        Pick<CashbookEntry, 'type' | 'amount' | 'category' | 'description' | 'date'>
      >;
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
