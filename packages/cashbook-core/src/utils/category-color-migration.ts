import { CATEGORY_COLOR_PALETTE } from '../constants/category-colors';
import { DEFAULT_CATEGORIES } from '../constants/default-categories';
import type { CategoryGroup, CategorySubGroup } from '../types';

/**
 * 예전 기본 카테고리·ColorPicker 기본값으로 쓰이던 색.
 * 기본 카테고리 대부분이 이 색 하나를 공유해 화면에서 카테고리를 색으로 구분할 수 없었다.
 */
export const LEGACY_CATEGORY_COLORS: ReadonlySet<string> = new Set([
  '#D8635A', // 지출 기본 카테고리 전부
  '#4CAF86', // 정기 수입 기본 카테고리
  '#63C39F', // 비정기 수입 기본 카테고리
  '#E8837A', // ColorPicker 기본값 (직접 추가한 카테고리)
]);

export type ColorMigrationCategory = {
  id: string;
  group: CategoryGroup;
  subGroup: CategorySubGroup;
  name: string;
  color: string;
  parentCategoryId: string | null;
  sortOrder: number;
};

const norm = (color: string) => color.trim().toUpperCase();
const isLegacy = (color: string) => LEGACY_CATEGORY_COLORS.has(norm(color));

/** 대시보드에서 한 화면(탭)에 함께 보이는 소분류 묶음 */
function tabOf(c: Pick<ColorMigrationCategory, 'group' | 'subGroup'>): string {
  if (c.group === 'income') return 'income';
  return c.subGroup === 'fixed_expense' ? 'fixed' : 'variable';
}

const defaultColorByKey = new Map(
  DEFAULT_CATEGORIES.map((d) => [`${d.group}|${d.subGroup}|${d.name}`, d.color])
);

/**
 * 한 커플의 카테고리 목록에서 예전 공용 색을 쓰는 카테고리에 새 색을 배정한다.
 * 사용자가 직접 고른 색(예전 공용 색이 아닌 색)은 건드리지 않는다.
 *
 * 1. 상위 카테고리
 *    - 기본 카테고리와 이름·소분류가 같으면 새 기본 색
 *    - 아니면 같은 탭에서 아직 안 쓰인 팔레트 색 (다 쓰였으면 순환)
 *    - 같은 이름(예: 공통 식비·각자 식비)은 내역에서 합쳐 보이므로 같은 색
 * 2. 하위 카테고리: 상위와 같은 색이었으면 상위의 새 색을 따라간다
 *
 * @returns 카테고리 id → 새 색 (바뀌는 카테고리만)
 */
export function planCategoryColorMigration(
  categories: readonly ColorMigrationCategory[]
): Map<string, string> {
  const updates = new Map<string, string>();
  const parents = categories
    .filter((c) => c.parentCategoryId === null)
    .sort((a, b) => a.subGroup.localeCompare(b.subGroup) || a.sortOrder - b.sortOrder);

  // 탭별로 이미 쓰인 색 (마이그레이션 대상이 아닌 상위 카테고리 색 + 새로 배정한 색)
  const usedByTab = new Map<string, Set<string>>();
  const used = (tab: string) => {
    let set = usedByTab.get(tab);
    if (!set) usedByTab.set(tab, (set = new Set()));
    return set;
  };
  for (const p of parents) if (!isLegacy(p.color)) used(tabOf(p)).add(norm(p.color));

  // 기본 카테고리 색을 먼저 확정해 사용자 카테고리가 그 색을 피하게 한다
  const assignedByName = new Map<string, string>();
  for (const p of parents) {
    if (!isLegacy(p.color)) continue;
    const color = defaultColorByKey.get(`${p.group}|${p.subGroup}|${p.name}`);
    if (!color) continue;
    updates.set(p.id, color);
    assignedByName.set(`${p.group}|${p.name}`, color);
    used(tabOf(p)).add(color);
  }

  for (const p of parents) {
    if (!isLegacy(p.color) || updates.has(p.id)) continue;
    const nameKey = `${p.group}|${p.name}`;
    let color = assignedByName.get(nameKey);
    if (!color) {
      const taken = used(tabOf(p));
      color =
        CATEGORY_COLOR_PALETTE.find((c) => !taken.has(c)) ??
        CATEGORY_COLOR_PALETTE[taken.size % CATEGORY_COLOR_PALETTE.length];
      taken.add(color);
      assignedByName.set(nameKey, color);
    }
    updates.set(p.id, color);
  }

  const byId = new Map(categories.map((c) => [c.id, c]));
  for (const c of categories) {
    if (c.parentCategoryId === null) continue;
    const parent = byId.get(c.parentCategoryId);
    const parentColor = parent && updates.get(parent.id);
    if (parent && parentColor && norm(c.color) === norm(parent.color)) {
      updates.set(c.id, parentColor);
    }
  }

  // 이미 같은 색이면 쓰지 않는다 (멱등)
  for (const [id, color] of updates) {
    const current = byId.get(id);
    if (current && norm(current.color) === norm(color)) updates.delete(id);
  }
  return updates;
}
