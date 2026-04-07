import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMonthlyEntries,
  addEntry,
  updateEntry,
  deleteEntry,
} from '@uandi/cashbook-core';
import type { CashbookEntry, CashbookEntryType } from '@uandi/cashbook-core';
import { db } from '@/lib/firebase';
import dayjs from 'dayjs';

export function useCashbookEntries(coupleId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: ['cashbookEntries', coupleId, year, month],
    queryFn: () => getMonthlyEntries(db, coupleId!, year, month),
    enabled: !!coupleId,
  });
}

export function useAddEntry(coupleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CashbookEntry, 'id' | 'coupleId' | 'createdAt'>) =>
      addEntry(db, coupleId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbookEntries', coupleId] });
    },
  });
}

export function useDeleteEntry(coupleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => deleteEntry(db, coupleId!, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashbookEntries', coupleId] });
    },
  });
}

export type MonthlySummary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

export function calcMonthlySummary(entries: CashbookEntry[] | undefined): MonthlySummary {
  if (!entries) return { totalIncome: 0, totalExpense: 0, balance: 0 };

  const totalIncome = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = entries
    .filter((e) => e.type === 'expense' || e.type === 'flex')
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  };
}

export type GroupedEntries = {
  date: string;
  entries: CashbookEntry[];
};

export function groupEntriesByDate(entries: CashbookEntry[] | undefined): GroupedEntries[] {
  if (!entries) return [];

  const grouped = new Map<string, CashbookEntry[]>();
  for (const entry of entries) {
    const dateKey = dayjs(entry.date.toDate()).format('YYYY-MM-DD');
    const existing = grouped.get(dateKey) ?? [];
    existing.push(entry);
    grouped.set(dateKey, existing);
  }

  return Array.from(grouped.entries())
    .map(([date, entries]) => ({ date, entries }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
