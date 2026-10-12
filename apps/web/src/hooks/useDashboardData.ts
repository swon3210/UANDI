import { useMemo } from 'react';
import { type Dayjs } from 'dayjs';
import { useCashbookEntriesInRange } from '@/hooks/useCashbook';
import { useCashbookCategories } from '@/hooks/useCashbookCategories';
import { getPeriodRange, type PeriodKind } from '@/utils/date';
import type { CashbookEntry, CashbookCategory, CategoryGroup, CategorySubGroup } from '@/types';

/** 'all'(전체)은 지출·수입·FLEX 총량 비교 전용 탭이다. */
export type GroupFilter = 'all' | CategoryGroup;

/** 지출·수입 그룹 안에서 고정/변동만 따로 보기 위한 세부 필터. */
export type SubGroupFilter = 'all' | 'fixed' | 'variable';

/** 고정/변동 세부 필터를 지원하는 그룹 (FLEX·전체는 고정/변동 구분이 없다) */
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
  /** 전체 탭용: 지출·수입·FLEX 유형별 기간 총량 (금액 0인 유형은 제외) */
  byType: CategorySlice[];
  total: number;
  hasEntries: boolean;
  comparison: PeriodComparison;
  isLoading: boolean;
  /** 비교 기간 데이터 로딩 중 (현재 기간과 별도로 비교 기간만 바꿀 수 있어 분리) */
  isCompareLoading: boolean;
};

// 카테고리별 시각적 구분을 위한 고대비 팔레트.
// 카테고리 메타의 color는 대부분 코랄 계열이라 라인/슬라이스가 구분이 안 되어
// 차트 표시 시에는 메타 색상을 덮어쓴다.
const CHART_PALETTE = [
  '#D8635A', // coral red (지출 시맨틱)
  '#4CAF86', // sage green (수입 시맨틱)
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#A855F7', // purple
  '#F97316', // orange
  '#0EA5E9', // sky
];

function categoryColor(
  _name: string,
  _categories: CashbookCategory[] | undefined,
  index: number
): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
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
    slices.push({ category, amount, color: categoryColor(category, categories, i) });
    i++;
  }
  return slices.sort((a, b) => b.amount - a.amount);
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
  categories: CashbookCategory[] | undefined
): CategoryTreeSlice[] {
  const byId = new Map((categories ?? []).map((c) => [c.id, c]));
  const parentOf = new Map<string, string>();
  for (const c of categories ?? []) {
    const parent = c.parentCategoryId ? byId.get(c.parentCategoryId) : undefined;
    if (parent) parentOf.set(`${c.group}:${c.name}`, parent.name);
  }

  // 상위 → (하위 이름 → 금액). 상위 직접 기록분은 상위 이름 키로 담는다.
  const tree = new Map<string, Map<string, number>>();
  for (const e of entries) {
    const parent = parentOf.get(`${e.type}:${e.category}`) ?? e.category;
    const children = tree.get(parent) ?? new Map<string, number>();
    children.set(e.category, (children.get(e.category) ?? 0) + e.amount);
    tree.set(parent, children);
  }

  const slices = [...tree.entries()].map(([parent, children]) => {
    const amount = [...children.values()].reduce((sum, v) => sum + v, 0);
    // 하위 없이 상위만 기록됐으면 펼칠 것이 없다.
    const isLeaf = children.size === 1 && children.has(parent);
    const childSlices = isLeaf
      ? []
      : [...children.entries()]
          .map(([name, value]) => ({
            category: name === parent ? directParentLabel(parent) : name,
            amount: value,
          }))
          .sort((a, b) => b.amount - a.amount)
          .map((c, i) => ({ ...c, color: CHART_PALETTE[i % CHART_PALETTE.length] }));
    return { category: parent, amount, children: childSlices };
  });

  return slices
    .sort((a, b) => b.amount - a.amount)
    .map((s, i) => ({ ...s, color: CHART_PALETTE[i % CHART_PALETTE.length] }));
}

// 유형 시맨틱 색 (지출=coral, 수입=sage, FLEX=amber — 기본 카테고리 색과 동일)
const TYPE_SLICES: Array<{ type: CategoryGroup; label: string; color: string }> = [
  { type: 'expense', label: '지출', color: '#D8635A' },
  { type: 'income', label: '수입', color: '#4CAF86' },
  { type: 'flex', label: 'FLEX', color: '#F0A05E' },
];

function buildByType(entries: CashbookEntry[]): CategorySlice[] {
  const sums = new Map<CategoryGroup, number>();
  for (const e of entries) sums.set(e.type, (sums.get(e.type) ?? 0) + e.amount);
  return TYPE_SLICES.map((t) => ({
    category: t.label,
    amount: sums.get(t.type) ?? 0,
    color: t.color,
  })).filter((s) => s.amount > 0);
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
    const filtered = filterEntries(entriesQuery.data ?? [], group, subGroup, fixedLookup);
    const compareFiltered = filterEntries(compareQuery.data ?? [], group, subGroup, fixedLookup);
    const total = computeTotal(filtered);

    return {
      byCategory: buildByCategory(filtered, categoriesQuery.data),
      byParent: buildByParent(filtered, categoriesQuery.data),
      byType: buildByType(entriesQuery.data ?? []),
      total,
      hasEntries: filtered.length > 0,
      comparison: {
        rows: buildComparisonRows(filtered, compareFiltered),
      },
      isLoading: entriesQuery.isLoading || categoriesQuery.isLoading,
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
  ]);
}
