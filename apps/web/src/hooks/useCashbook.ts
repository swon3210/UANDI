import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  getMonthlyEntries,
  addEntry,
  updateEntry,
  deleteEntry,
} from '@/services/cashbook';
import type { CashbookEntry } from '@/types';

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
    mutationFn: (data: Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'>) =>
      addEntry(coupleId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
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
