'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { getMonthlyEntries } from '@/services/cashbook';
import type { CashbookCategory, CashbookEntry } from '@/types';

const QUERY_KEY = 'cashbookEntries';

export type OrphanGroup = {
  name: string;
  entries: CashbookEntry[];
};

export type OrphanedEntriesResult = {
  groups: OrphanGroup[];
  totalCount: number;
  monthsLoaded: number;
  fetchMoreMonths: (n?: number) => void;
  isLoading: boolean;
};

export function useOrphanedEntries(
  coupleId: string | null,
  categories: CashbookCategory[] | undefined,
  initialMonths: number = 3
): OrphanedEntriesResult {
  const [monthsLoaded, setMonthsLoaded] = useState(initialMonths);

  const monthSpecs = useMemo(() => {
    const now = dayjs();
    return Array.from({ length: monthsLoaded }, (_, i) => {
      const d = now.subtract(i, 'month');
      return { year: d.year(), month: d.month() };
    });
  }, [monthsLoaded]);

  const queries = useQueries({
    queries: monthSpecs.map(({ year, month }) => ({
      queryKey: [QUERY_KEY, coupleId, year, month],
      queryFn: () => getMonthlyEntries(coupleId!, year, month),
      enabled: !!coupleId,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);

  const allEntries = useMemo(() => {
    const list: CashbookEntry[] = [];
    for (const q of queries) {
      if (q.data) list.push(...q.data);
    }
    return list;
  }, [queries]);

  const { groups, totalCount } = useMemo(() => {
    if (!categories) {
      return { groups: [] as OrphanGroup[], totalCount: 0 };
    }
    const presetNames = new Set(categories.map((c) => c.name));
    const byName = new Map<string, CashbookEntry[]>();
    for (const e of allEntries) {
      if (presetNames.has(e.category)) continue;
      const arr = byName.get(e.category) ?? [];
      arr.push(e);
      byName.set(e.category, arr);
    }
    const groupList: OrphanGroup[] = [];
    for (const [name, entries] of byName) {
      entries.sort((a, b) => b.date.toMillis() - a.date.toMillis());
      groupList.push({ name, entries });
    }
    groupList.sort(
      (a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name)
    );
    return {
      groups: groupList,
      totalCount: groupList.reduce((sum, g) => sum + g.entries.length, 0),
    };
  }, [allEntries, categories]);

  return {
    groups,
    totalCount,
    monthsLoaded,
    fetchMoreMonths: (n = 1) => setMonthsLoaded((prev) => prev + n),
    isLoading,
  };
}
