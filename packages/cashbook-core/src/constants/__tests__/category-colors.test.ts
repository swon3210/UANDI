import { describe, expect, it } from 'vitest';
import {
  CATEGORY_COLOR_PALETTE,
  FALLBACK_CATEGORY_COLOR,
  buildCategoryColorMap,
  distinctColors,
  getCategoryColor,
  shadeColor,
} from '../category-colors';
import { COLOR_PRESETS, DEFAULT_CATEGORIES } from '../default-categories';

const cat = (
  over: Partial<{
    group: 'expense' | 'income';
    subGroup: 'fixed_expense' | 'variable_common' | 'variable_personal' | 'regular_income';
    name: string;
    color: string;
    parentCategoryId: string | null;
    sortOrder: number;
  }>
) => ({
  group: 'expense' as const,
  subGroup: 'variable_common' as const,
  name: '식비',
  color: '#D8635A',
  parentCategoryId: null,
  sortOrder: 0,
  ...over,
});

describe('CATEGORY_COLOR_PALETTE', () => {
  it('중복 색이 없다', () => {
    expect(new Set(CATEGORY_COLOR_PALETTE).size).toBe(CATEGORY_COLOR_PALETTE.length);
  });

  it('ColorPicker 선택지와 같다', () => {
    expect(COLOR_PRESETS).toEqual(CATEGORY_COLOR_PALETTE);
  });
});

describe('DEFAULT_CATEGORIES 색 배정', () => {
  it('모든 기본 카테고리 색은 팔레트 안에 있다', () => {
    const palette = new Set<string>(CATEGORY_COLOR_PALETTE);
    for (const c of DEFAULT_CATEGORIES) expect(palette.has(c.color)).toBe(true);
  });

  it('같은 이름은 같은 색을 쓴다 (내역에서는 이름으로 합쳐 보이므로)', () => {
    const byName = new Map<string, string>();
    for (const c of DEFAULT_CATEGORIES) {
      const key = `${c.group}:${c.name}`;
      if (byName.has(key)) expect(c.color).toBe(byName.get(key));
      byName.set(key, c.color);
    }
  });

  it.each([
    ['수입', (c: (typeof DEFAULT_CATEGORIES)[number]) => c.group === 'income'],
    ['고정 지출', (c: (typeof DEFAULT_CATEGORIES)[number]) => c.subGroup === 'fixed_expense'],
    [
      '변동 지출',
      (c: (typeof DEFAULT_CATEGORIES)[number]) =>
        c.subGroup === 'variable_common' || c.subGroup === 'variable_personal',
    ],
  ])('%s 탭에 함께 보이는 카테고리끼리는 색이 겹치지 않는다', (_label, filter) => {
    const colorByName = new Map<string, string>();
    for (const c of DEFAULT_CATEGORIES.filter(filter)) colorByName.set(c.name, c.color);
    const colors = [...colorByName.values()];
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe('buildCategoryColorMap / getCategoryColor', () => {
  it('저장된 카테고리 색을 그대로 돌려준다', () => {
    const map = buildCategoryColorMap([cat({ name: '교통', color: '#6A6FD8' })]);
    expect(getCategoryColor(map, 'expense', '교통')).toBe('#6A6FD8');
  });

  it('같은 이름이 여러 개면 상위·정렬 순서가 앞선 카테고리 색을 쓴다', () => {
    const map = buildCategoryColorMap([
      cat({ name: '식비', color: '#111111', parentCategoryId: 'p1', sortOrder: 0 }),
      cat({ name: '식비', color: '#222222', subGroup: 'variable_personal', sortOrder: 3 }),
      cat({ name: '식비', color: '#333333', sortOrder: 1 }),
    ]);
    expect(getCategoryColor(map, 'expense', '식비')).toBe('#333333');
  });

  it('지출/수입은 같은 이름이어도 따로 본다', () => {
    const map = buildCategoryColorMap([
      cat({ name: '기타', color: '#111111' }),
      cat({ name: '기타', color: '#222222', group: 'income', subGroup: 'regular_income' }),
    ]);
    expect(getCategoryColor(map, 'expense', '기타')).toBe('#111111');
    expect(getCategoryColor(map, 'income', '기타')).toBe('#222222');
  });

  it('메타가 없으면 중립색', () => {
    expect(getCategoryColor(buildCategoryColorMap(undefined), 'expense', '삭제됨')).toBe(
      FALLBACK_CATEGORY_COLOR
    );
  });
});

describe('shadeColor', () => {
  it('양수는 밝게, 음수는 어둡게', () => {
    expect(shadeColor('#000000', 0.5)).toBe('#808080');
    expect(shadeColor('#FFFFFF', -0.5)).toBe('#808080');
  });

  it('파싱 불가한 색은 그대로', () => {
    expect(shadeColor('hsl(var(--expense))', 0.3)).toBe('hsl(var(--expense))');
  });
});

describe('distinctColors', () => {
  it('겹치지 않으면 그대로 둔다', () => {
    expect(distinctColors(['#D8635A', '#4CAF86'])).toEqual(['#D8635A', '#4CAF86']);
  });

  it('겹치면 첫 번째는 원색, 이후는 같은 계열의 다른 명도로 바꾼다', () => {
    const result = distinctColors(['#D8635A', '#D8635A', '#d8635a']);
    expect(result[0]).toBe('#D8635A');
    expect(new Set(result).size).toBe(3);
  });

  it('바꾼 색이 다른 슬라이스 색과 다시 겹치지 않는다', () => {
    const lighter = shadeColor('#D8635A', 0.35);
    const result = distinctColors(['#D8635A', lighter, '#D8635A']);
    expect(new Set(result).size).toBe(3);
  });
});
