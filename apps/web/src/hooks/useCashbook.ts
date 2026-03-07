import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getMonthlyEntries } from '@/services/cashbook';
import type { CashbookEntry } from '@/types';

export function useMonthlyEntries(coupleId: string | null) {
  const now = dayjs();
  const year = now.year();
  const month = now.month(); // 0-indexed

  return useQuery({
    queryKey: ['monthlyEntries', coupleId, year, month],
    queryFn: () => getMonthlyEntries(coupleId!, year, month),
    enabled: !!coupleId,
  });
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
