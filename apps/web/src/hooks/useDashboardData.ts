import { useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { buildCategoryColorMap, distinctColors, getCategoryColor } from '@uandi/cashbook-core';
import { useCashbookEntriesInRange } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { getPeriodRange, isCurrentPeriod, type PeriodKind } from '@/utils/date';
import {
  buildMonthProjection,
  buildUpcomingFixed,
  buildUpcomingFixedYear,
  buildYearProjection,
  pickUpcomingFixed,
  type MonthProjection,
  type UpcomingFixed,
  type YearProjection,
} from '@/utils/upcoming-fixed';
import type { CashbookEntry, CashbookCategory, CategoryGroup, CategorySubGroup } from '@/types';

/** 'all'(전체)은 지출·수입 총량 비교 전용 탭이다. */
export type GroupFilter = 'all' | CategoryGroup;

/** 지출·수입 그룹 안에서 고정/변동만 따로 보기 위한 세부 필터. */
export type SubGroupFilter = 'all' | 'fixed' | 'variable';

/** 고정/변동 세부 필터를 지원하는 그룹 (전체 탭은 고정/변동 구분이 없다) */
export function supportsSubGroup(group: GroupFilter): group is 'expense' | 'income' {
  return group === 'expense' || group === 'income';
}

// 고정 지출(fixed_expense)·정기 수입(regular_income)을 "고정"으로, 나머지를 "변동"으로 본다.
const FIXED_SUB_GROUPS: ReadonlySet<CategorySubGroup> = new Set([
  'fixed_expense',
  'regular_income',
]);

export type CategorySlice = {
  category: string;
  amount: number;
  color: string;
};

export type CategoryComparisonRow = {
  category: string;
  current: number;
  compare: number;
};

export type PeriodComparison = {
  /** 두 기간 중 어느 한쪽에라도 금액이 있는 카테고리. 현재 → 비교 금액 내림차순. */
  rows: CategoryComparisonRow[];
};

/** 상위 카테고리 기준 슬라이스. 하위가 있으면 children에 하위별 금액(상위 직접 기록분은 '상위(기타)')을 담는다. */
export type CategoryTreeSlice = CategorySlice & {
  children: CategorySlice[];
};

export type DashboardData = {
  byCategory: CategorySlice[];
  /** 도넛용: 하위 카테고리 금액을 상위로 합친 슬라이스 (금액 내림차순) */
  byParent: CategoryTreeSlice[];
  /** 전체 탭용: 지출·수입 유형별 기간 총량 (그룹 필터와 무관) */
  typeTotals: Record<CategoryGroup, number>;
  /** 지출·수입의 세부 필터 '전체'용: 고정/변동 총량 (금액 0인 쪽은 제외) */
  byFixedVariable: CategorySlice[];
  total: number;
  hasEntries: boolean;
  comparison: PeriodComparison;
  /**
   * 현재 기간일 때만(이번 달 또는 올해): 아직 기록되지 않은 고정 지출·수입 발생분(그룹 필터와 무관, 전체).
   * 월간은 이달 남은 발생분, 연간은 오늘부터 12월까지. 과거 기간·로딩 중에는 null
   * (과거 기간에 예정을 얹으면 기록이 아닌 숫자가 섞이므로).
   */
  upcoming: UpcomingFixed | null;
  /**
   * 월간 탭의 지출·수입 탭 + 이번 달일 때만: 현재 필터(그룹·고정/변동)의 이달 누적 흐름과 예정 투영.
   * 변동 탭은 예정이 없어도 실제 누적만 담긴다. 전체 탭·다른 달·연간은 null.
   */
  projection: MonthProjection | null;
  /** 연간 탭의 지출·수입 탭 + 올해일 때만: 현재 필터의 월별 실제·예정 투영. */
  yearProjection: YearProjection | null;
  isLoading: boolean;
  /** 비교 기간 데이터 로딩 중 (현재 기간과 별도로 비교 기간만 바꿀 수 있어 분리) */
  isCompareLoading: boolean;
};

/** 슬라이스 색을 한 차트 안에서 겹치지 않게 정리한다(같은 색은 같은 계열의 다른 명도로). */
function withDistinctColors<T extends { color: string }>(slices: T[]): T[] {
  const colors = distinctColors(slices.map((s) => s.color));
  return slices.map((s, i) => ({ ...s, color: colors[i] }));
}

function buildByCategory(
  entries: CashbookEntry[],
  colorMap: ReadonlyMap<string, string>
): CategorySlice[] {
  const sums = new Map<string, { group: CategoryGroup; amount: number }>();
  for (const entry of entries) {
    const prev = sums.get(entry.category);
    sums.set(entry.category, {
      group: prev?.group ?? entry.type,
      amount: (prev?.amount ?? 0) + entry.amount,
    });
  }

  const slices = [...sums.entries()]
    .map(([category, { group, amount }]) => ({
      category,
      amount,
      color: getCategoryColor(colorMap, group, category),
    }))
    .sort((a, b) => b.amount - a.amount);
  return withDistinctColors(slices);
}

/** 상위에 직접 기록된 금액을 하위 목록에서 구분해 보여줄 때의 라벨 */
export function directParentLabel(parent: string): string {
  return `${parent}(기타)`;
}

/**
 * 하위 카테고리 금액을 상위 카테고리로 합친다. 카테고리 메타(타입+이름 → 상위 이름)로 판단하고,
 * 메타에 없거나 상위가 없는 카테고리는 그 자체가 상위다.
 */
function buildByParent(
  entries: CashbookEntry[],
  categories: CashbookCategory[] | undefined,
  colorMap: ReadonlyMap<string, string>
): CategoryTreeSlice[] {
  const byId = new Map((categories ?? []).map((c) => [c.id, c]));
  const parentOf = new Map<string, string>();
  for (const c of categories ?? []) {
    const parent = c.parentCategoryId ? byId.get(c.parentCategoryId) : undefined;
    if (parent) parentOf.set(`${c.group}:${c.name}`, parent.name);
  }

  // 상위 → (하위 이름 → 금액). 상위 직접 기록분은 상위 이름 키로 담는다.
  const tree = new Map<string, Map<string, number>>();
  const groupOf = new Map<string, CategoryGroup>();
  for (const e of entries) {
    const parent = parentOf.get(`${e.type}:${e.category}`) ?? e.category;
    const children = tree.get(parent) ?? new Map<string, number>();
    children.set(e.category, (children.get(e.category) ?? 0) + e.amount);
    tree.set(parent, children);
    if (!groupOf.has(parent)) groupOf.set(parent, e.type);
  }

  const slices = [...tree.entries()].map(([parent, children]) => {
    const group = groupOf.get(parent) ?? 'expense';
    const amount = [...children.values()].reduce((sum, v) => sum + v, 0);
    // 하위 없이 상위만 기록됐으면 펼칠 것이 없다.
    const isLeaf = children.size === 1 && children.has(parent);
    const childSlices = isLeaf
      ? []
      : [...children.entries()]
          .map(([name, value]) => ({
            category: name === parent ? directParentLabel(parent) : name,
            amount: value,
            // 상위 직접 기록분은 상위 색, 하위는 하위 카테고리 색
            color: getCategoryColor(colorMap, group, name),
          }))
          .sort((a, b) => b.amount - a.amount);
    return {
      category: parent,
      amount,
      color: getCategoryColor(colorMap, group, parent),
      // 하위는 보통 상위 색을 물려받으므로 펼친 도넛에서는 같은 계열의 명도로 구분한다
      children: withDistinctColors(childSlices),
    };
  });

  return withDistinctColors(slices.sort((a, b) => b.amount - a.amount));
}

function buildTypeTotals(entries: CashbookEntry[]): Record<CategoryGroup, number> {
  const totals: Record<CategoryGroup, number> = { expense: 0, income: 0 };
  for (const e of entries) totals[e.type] += e.amount;
  return totals;
}

const FIXED_VARIABLE_LABEL: Record<'expense' | 'income', [string, string]> = {
  expense: ['고정 지출', '변동 지출'],
  income: ['고정 수입', '변동 수입'],
};
// 고정/변동은 카테고리가 아닌 묶음이라 카테고리 색과 겹치지 않는 고정 색을 쓴다.
const FIXED_VARIABLE_COLOR: [string, string] = ['#D8635A', '#3B82F6'];

function buildByFixedVariable(
  entries: CashbookEntry[],
  group: GroupFilter,
  fixedLookup: Set<string>
): CategorySlice[] {
  if (!supportsSubGroup(group)) return [];
  let fixed = 0;
  let variable = 0;
  for (const e of entries) {
    if (e.type !== group) continue;
    if (fixedLookup.has(`${e.type}:${e.category}`)) fixed += e.amount;
    else variable += e.amount;
  }
  const [fixedLabel, variableLabel] = FIXED_VARIABLE_LABEL[group];
  return [
    { category: fixedLabel, amount: fixed, color: FIXED_VARIABLE_COLOR[0] },
    { category: variableLabel, amount: variable, color: FIXED_VARIABLE_COLOR[1] },
  ].filter((s) => s.amount > 0);
}

function computeTotal(entries: CashbookEntry[]): number {
  return entries.reduce((sum, e) => sum + e.amount, 0);
}

/** 엔트리 타입+카테고리 이름 → 고정 여부. 같은 이름이 여러 세부 그룹에 있으면 하나라도 고정이면 고정. */
function buildFixedLookup(categories: CashbookCategory[] | undefined): Set<string> {
  const fixed = new Set<string>();
  for (const c of categories ?? []) {
    if (FIXED_SUB_GROUPS.has(c.subGroup)) fixed.add(`${c.group}:${c.name}`);
  }
  return fixed;
}

function filterEntries(
  entries: CashbookEntry[],
  group: GroupFilter,
  subGroup: SubGroupFilter,
  fixedLookup: Set<string>
): CashbookEntry[] {
  if (group === 'all') return entries;
  const byGroup = entries.filter((e) => e.type === group);
  if (!supportsSubGroup(group) || subGroup === 'all') return byGroup;
  // 카테고리 메타에 없는(삭제·이름 변경된) 카테고리는 변동으로 취급한다.
  return byGroup.filter(
    (e) => fixedLookup.has(`${e.type}:${e.category}`) === (subGroup === 'fixed')
  );
}

/** 카테고리별 비교 행 (현재·비교 기간 금액). */
function buildComparisonRows(
  current: CashbookEntry[],
  compare: CashbookEntry[]
): CategoryComparisonRow[] {
  const rows = new Map<string, CategoryComparisonRow>();
  const row = (category: string) => {
    let r = rows.get(category);
    if (!r) {
      r = { category, current: 0, compare: 0 };
      rows.set(category, r);
    }
    return r;
  };
  for (const e of current) row(e.category).current += e.amount;
  for (const e of compare) row(e.category).compare += e.amount;
  return [...rows.values()].sort((a, b) => b.current - a.current || b.compare - a.compare);
}

export function useDashboardData(args: {
  coupleId: string | null;
  period: PeriodKind;
  group: GroupFilter;
  subGroup: SubGroupFilter;
  cursor: Dayjs;
  /** 비교 기간 커서 (같은 period 단위) */
  compareCursor: Dayjs;
}): DashboardData {
  const { coupleId, period, group, subGroup, cursor, compareCursor } = args;
  const { start, end } = useMemo(() => getPeriodRange(period, cursor), [period, cursor]);
  const compareRange = useMemo(
    () => getPeriodRange(period, compareCursor),
    [period, compareCursor]
  );

  const entriesQuery = useCashbookEntriesInRange(coupleId, start, end);
  const compareQuery = useCashbookEntriesInRange(coupleId, compareRange.start, compareRange.end);
  const categoriesQuery = useCashbookCategories(coupleId);

  return useMemo(() => {
    const fixedLookup = buildFixedLookup(categoriesQuery.data);
    const colorMap = buildCategoryColorMap(categoriesQuery.data);
    const filtered = filterEntries(entriesQuery.data ?? [], group, subGroup, fixedLookup);
    const compareFiltered = filterEntries(compareQuery.data ?? [], group, subGroup, fixedLookup);
    const total = computeTotal(filtered);
    const isLoading = entriesQuery.isLoading || categoriesQuery.isLoading;
    // 로딩 중엔 실거래(G1)가 아직 없어 예정 건수가 잠깐 부풀어 보이므로 숨긴다.
    const isCurrent = !isLoading && isCurrentPeriod(period, cursor);
    const upcoming = !isCurrent
      ? null
      : period === 'monthly'
        ? buildUpcomingFixed(categoriesQuery.data ?? [], entriesQuery.data ?? [], dayjs())
        : buildUpcomingFixedYear(categoriesQuery.data ?? [], entriesQuery.data ?? [], dayjs());
    // 투영은 합계 KPI와 같은 필터 기준. 변동 탭엔 예정 개념이 없으니 예정 없이 실제만.
    const upcomingForFilter =
      upcoming && supportsSubGroup(group)
        ? pickUpcomingFixed(upcoming, subGroup === 'variable' ? [] : [group], null).items
        : null;
    const projection =
      upcomingForFilter && period === 'monthly'
        ? buildMonthProjection(filtered, upcomingForFilter, dayjs())
        : null;
    const yearProjection =
      upcomingForFilter && period === 'yearly'
        ? buildYearProjection(filtered, upcomingForFilter, dayjs())
        : null;

    return {
      byCategory: buildByCategory(filtered, colorMap),
      byParent: buildByParent(filtered, categoriesQuery.data, colorMap),
      typeTotals: buildTypeTotals(entriesQuery.data ?? []),
      byFixedVariable: buildByFixedVariable(entriesQuery.data ?? [], group, fixedLookup),
      total,
      hasEntries: filtered.length > 0,
      comparison: {
        rows: buildComparisonRows(filtered, compareFiltered),
      },
      upcoming,
      projection,
      yearProjection,
      isLoading,
      isCompareLoading: compareQuery.isLoading,
    };
  }, [
    entriesQuery.data,
    entriesQuery.isLoading,
    compareQuery.data,
    compareQuery.isLoading,
    categoriesQuery.data,
    categoriesQuery.isLoading,
    group,
    subGroup,
    period,
    cursor,
  ]);
}
