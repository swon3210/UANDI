import { useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { useCashbookEntriesInRange } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { getPeriodRange, type PeriodKind } from '@/utils/date';
import type { CashbookEntry, CashbookCategory, CategoryGroup } from '@/types';

export type GroupFilter = 'all' | CategoryGroup;

export type TrendPoint = {
  label: string;
  total: number;
  bucketKey: string;
};

export type CategorySlice = {
  category: string;
  amount: number;
  color: string;
};

export type DashboardData = {
  trend: TrendPoint[];
  byCategory: CategorySlice[];
  total: number;
  hasEntries: boolean;
  isLoading: boolean;
};

const FALLBACK_PALETTE = [
  '#E8837A',
  '#4CAF86',
  '#F9B2AC',
  '#98D9BF',
  '#D5CFCA',
  '#BE4B44',
  '#368869',
  '#B4AEA8',
];

function buildTrend(
  entries: CashbookEntry[],
  period: PeriodKind,
  cursor: Dayjs
): TrendPoint[] {
  if (period === 'weekly') {
    const start = cursor.startOf('week');
    const points: TrendPoint[] = Array.from({ length: 7 }, (_, i) => {
      const d = start.add(i, 'day');
      return {
        label: d.format('dd'),
        bucketKey: d.format('YYYY-MM-DD'),
        total: 0,
      };
    });
    for (const entry of entries) {
      const key = dayjs(entry.date.toDate()).format('YYYY-MM-DD');
      const point = points.find((p) => p.bucketKey === key);
      if (point) point.total += entry.amount;
    }
    return points;
  }

  if (period === 'monthly') {
    const start = cursor.startOf('month');
    const daysInMonth = cursor.daysInMonth();
    const points: TrendPoint[] = Array.from({ length: daysInMonth }, (_, i) => {
      const d = start.add(i, 'day');
      return {
        label: String(i + 1),
        bucketKey: d.format('YYYY-MM-DD'),
        total: 0,
      };
    });
    for (const entry of entries) {
      const key = dayjs(entry.date.toDate()).format('YYYY-MM-DD');
      const point = points.find((p) => p.bucketKey === key);
      if (point) point.total += entry.amount;
    }
    return points;
  }

  // yearly: 12 months
  const points: TrendPoint[] = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}월`,
    bucketKey: `${cursor.year()}-${String(i + 1).padStart(2, '0')}`,
    total: 0,
  }));
  for (const entry of entries) {
    const d = dayjs(entry.date.toDate());
    const key = `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`;
    const point = points.find((p) => p.bucketKey === key);
    if (point) point.total += entry.amount;
  }
  return points;
}

function buildByCategory(
  entries: CashbookEntry[],
  categories: CashbookCategory[] | undefined
): CategorySlice[] {
  const sums = new Map<string, number>();
  for (const entry of entries) {
    sums.set(entry.category, (sums.get(entry.category) ?? 0) + entry.amount);
  }

  const slices: CategorySlice[] = [];
  let i = 0;
  for (const [category, amount] of sums.entries()) {
    const meta = categories?.find((c) => c.name === category);
    slices.push({
      category,
      amount,
      color: meta?.color ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length],
    });
    i++;
  }
  return slices.sort((a, b) => b.amount - a.amount);
}

function computeTotal(entries: CashbookEntry[], group: GroupFilter): number {
  if (group === 'all') {
    let income = 0;
    let outflow = 0;
    for (const e of entries) {
      if (e.type === 'income') income += e.amount;
      else outflow += e.amount;
    }
    return income - outflow;
  }
  return entries.reduce((sum, e) => sum + e.amount, 0);
}

export function useDashboardData(args: {
  coupleId: string | null;
  period: PeriodKind;
  group: GroupFilter;
  cursor: Dayjs;
}): DashboardData {
  const { coupleId, period, group, cursor } = args;
  const { start, end } = useMemo(() => getPeriodRange(period, cursor), [period, cursor]);

  const entriesQuery = useCashbookEntriesInRange(coupleId, start, end);
  const categoriesQuery = useCashbookCategories(coupleId);

  return useMemo(() => {
    const allEntries = entriesQuery.data ?? [];
    const filtered =
      group === 'all' ? allEntries : allEntries.filter((e) => e.type === group);

    return {
      trend: buildTrend(filtered, period, cursor),
      byCategory: buildByCategory(filtered, categoriesQuery.data),
      total: computeTotal(filtered, group),
      hasEntries: filtered.length > 0,
      isLoading: entriesQuery.isLoading || categoriesQuery.isLoading,
    };
  }, [
    entriesQuery.data,
    entriesQuery.isLoading,
    categoriesQuery.data,
    categoriesQuery.isLoading,
    group,
    period,
    cursor,
  ]);
}
