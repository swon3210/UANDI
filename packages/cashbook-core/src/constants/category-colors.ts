import type { CashbookCategory, CategoryGroup } from '../types';

/**
 * 카테고리 색상 팔레트 — 카테고리 색의 단일 기준.
 *
 * - 카테고리 생성/수정의 ColorPicker 선택지
 * - 기본 카테고리(DEFAULT_CATEGORIES)의 색
 * - 대시보드 차트·카테고리 필터 등 카테고리를 색으로 표시하는 모든 곳
 *
 * 화면은 항상 카테고리 문서에 저장된 `color`를 그대로 쓴다(`buildCategoryColorMap`).
 * 차트처럼 한 화면에 같은 색이 겹치면 구분이 안 되는 곳만 `distinctColors`로
 * 같은 색 계열의 명도만 바꿔 구분한다(색 계열은 카테고리 색과 동일하게 유지).
 */
export const CATEGORY_COLOR_PALETTE = [
  '#E8837A', // coral (primary)
  '#D8635A', // deep coral (expense)
  '#F0A05E', // orange
  '#E5B53E', // mustard
  '#8BC34A', // lime
  '#4CAF86', // sage (income)
  '#2E9C8F', // teal
  '#5BBDD8', // cyan
  '#5B8DEF', // blue
  '#6A6FD8', // indigo
  '#9B7ED8', // purple
  '#C77DD1', // orchid
  '#E87CA0', // pink
  '#B98565', // brown
  '#78909C', // blue grey
] as const;

/** 카테고리 메타를 찾을 수 없을 때(삭제된 카테고리 등) 쓰는 중립색 */
export const FALLBACK_CATEGORY_COLOR = '#78909C';

/**
 * 내역은 카테고리를 `타입 + 이름`으로 참조하므로 색 조회 키도 같은 형태를 쓴다.
 */
export function categoryColorKey(group: CategoryGroup, name: string): string {
  return `${group}:${name}`;
}

type ColorSource = Pick<
  CashbookCategory,
  'group' | 'name' | 'color' | 'parentCategoryId' | 'subGroup' | 'sortOrder'
>;

/**
 * 카테고리 목록 → `타입:이름` → 색 맵.
 * 같은 이름이 여러 소분류에 있으면(예: 공통 식비·각자 식비) 상위 카테고리, 정렬 순서가
 * 앞선 카테고리의 색을 쓴다 — 내역에서는 둘이 구분되지 않으므로 색도 하나로 모은다.
 */
export function buildCategoryColorMap(
  categories: readonly ColorSource[] | undefined
): Map<string, string> {
  const ordered = [...(categories ?? [])].sort((a, b) => {
    const level = Number(a.parentCategoryId !== null) - Number(b.parentCategoryId !== null);
    if (level !== 0) return level;
    return a.sortOrder - b.sortOrder;
  });
  const map = new Map<string, string>();
  for (const c of ordered) {
    const key = categoryColorKey(c.group, c.name);
    if (!map.has(key) && c.color) map.set(key, c.color);
  }
  return map;
}

/** 색 맵에서 카테고리 색을 찾는다. 없으면 중립색. */
export function getCategoryColor(
  colorMap: ReadonlyMap<string, string>,
  group: CategoryGroup,
  name: string
): string {
  return colorMap.get(categoryColorKey(group, name)) ?? FALLBACK_CATEGORY_COLOR;
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/**
 * 같은 색 계열에서 명도만 바꾼다. amount > 0이면 흰색 쪽으로, < 0이면 검은색 쪽으로 섞는다.
 * 파싱할 수 없는 색은 그대로 돌려준다.
 */
export function shadeColor(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const target = amount > 0 ? 255 : 0;
  const t = Math.min(Math.abs(amount), 1);
  return toHex(rgb.map((v) => v + (target - v) * t) as [number, number, number]);
}

// 겹친 색의 n번째 반복에 적용할 명도 변화 (밝게 ↔ 어둡게 번갈아, 점점 크게)
const DUPLICATE_SHADES = [0.35, -0.3, 0.6, -0.5, 0.75];

/**
 * 한 차트 안에서 같은 색이 반복되면 두 번째부터 같은 계열의 다른 명도로 바꾼다.
 * 처음 나온 색은 카테고리 색 그대로 둔다(입력 순서 = 우선순위, 보통 금액 내림차순).
 */
export function distinctColors(colors: readonly string[]): string[] {
  const used = new Set<string>();
  const seen = new Map<string, number>();
  return colors.map((color) => {
    const base = color.toUpperCase();
    let result = base;
    let n = seen.get(base) ?? 0;
    while (used.has(result) && n < DUPLICATE_SHADES.length) {
      result = shadeColor(base, DUPLICATE_SHADES[n]);
      n++;
    }
    seen.set(base, n);
    used.add(result);
    return result;
  });
}
