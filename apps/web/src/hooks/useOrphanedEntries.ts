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

  // 첫 등장 시점의 순위를 기억해, 재매칭으로 count가 바뀌어도 카드 순서가 흔들리지 않게 한다.
  const [orderMap, setOrderMap] = useState<Map<string, number>>(() => new Map());

  const { groups, totalCount, nextOrderMap } = useMemo(() => {
    if (!categories) {
      return {
        groups: [] as OrphanGroup[],
        totalCount: 0,
        nextOrderMap: orderMap,
      };
    }
    const presetNames = new Set(categories.map((c) => c.name));
    const byName = new Map<string, CashbookEntry[]>();
    for (const e of allEntries) {
      if (presetNames.has(e.category)) continue;
      const arr = byName.get(e.category) ?? [];
      arr.push(e);
      byName.set(e.category, arr);
    }

    const newNames = Array.from(byName.keys()).filter((n) => !orderMap.has(n));
    let effectiveMap = orderMap;
    if (newNames.length > 0) {
      newNames.sort((a, b) => {
        const ca = byName.get(a)!.length;
        const cb = byName.get(b)!.length;
        return cb - ca || a.localeCompare(b);
      });
      effectiveMap = new Map(orderMap);
      let i = orderMap.size;
      for (const name of newNames) {
        effectiveMap.set(name, i++);
      }
    }

    const groupList: OrphanGroup[] = [];
    for (const [name, entries] of byName) {
      entries.sort((a, b) => b.date.toMillis() - a.date.toMillis());
      groupList.push({ name, entries });
    }
    groupList.sort((a, b) => (effectiveMap.get(a.name) ?? 0) - (effectiveMap.get(b.name) ?? 0));
    return {
      groups: groupList,
      totalCount: groupList.reduce((sum, g) => sum + g.entries.length, 0),
      nextOrderMap: effectiveMap,
    };
  }, [allEntries, categories, orderMap]);

  // 새 카테고리가 등장하면 순서를 보존한다. 다음 렌더부터는 동일한 effectiveMap으로 안정화.
  if (nextOrderMap !== orderMap) {
    setOrderMap(nextOrderMap);
  }

  return {
    groups,
    totalCount,
    monthsLoaded,
    fetchMoreMonths: (n = 1) => setMonthsLoaded((prev) => prev + n),
    isLoading,
  };
}
