import { describe, expect, it } from 'vitest';
import {
  planCategoryColorMigration,
  type ColorMigrationCategory,
} from '../category-color-migration';

let seq = 0;
const cat = (over: Partial<ColorMigrationCategory>): ColorMigrationCategory => ({
  id: `c${seq++}`,
  group: 'expense',
  subGroup: 'variable_common',
  name: '식비',
  color: '#D8635A',
  parentCategoryId: null,
  sortOrder: 0,
  ...over,
});

describe('planCategoryColorMigration', () => {
  it('예전 공용 색을 쓰는 기본 카테고리는 새 기본 색으로 바꾼다', () => {
    const traffic = cat({ subGroup: 'variable_personal', name: '교통' });
    const salary = cat({
      group: 'income',
      subGroup: 'regular_income',
      name: '상여',
      color: '#4CAF86',
    });
    const updates = planCategoryColorMigration([traffic, salary]);
    expect(updates.get(traffic.id)).toBe('#6A6FD8');
    expect(updates.get(salary.id)).toBe('#E5B53E');
  });

  it('사용자가 고른 색은 건드리지 않는다', () => {
    const custom = cat({ name: '교통', subGroup: 'variable_personal', color: '#123456' });
    expect(planCategoryColorMigration([custom]).has(custom.id)).toBe(false);
  });

  it('이미 새 색이면 바꾸지 않는다 (멱등)', () => {
    const food = cat({ name: '식비', color: '#D8635A' });
    expect(planCategoryColorMigration([food]).size).toBe(0);
  });

  it('직접 추가한 카테고리는 같은 탭에서 안 쓰인 색을 받는다', () => {
    const a = cat({ name: '반려동물', color: '#E8837A', sortOrder: 10 });
    const b = cat({ name: '경조사', color: '#D8635A', sortOrder: 11 });
    const taken = cat({ name: '커스텀', color: '#F0A05E', sortOrder: 12 });
    const food = cat({ name: '식비', sortOrder: 0 });
    const updates = planCategoryColorMigration([a, b, taken, food]);
    const colors = [updates.get(a.id), updates.get(b.id), '#F0A05E', '#D8635A'];
    expect(new Set(colors).size).toBe(4);
  });

  it('같은 이름의 사용자 카테고리는 같은 색을 받는다', () => {
    const common = cat({ name: '반려동물', subGroup: 'variable_common' });
    const personal = cat({ name: '반려동물', subGroup: 'variable_personal' });
    const updates = planCategoryColorMigration([common, personal]);
    expect(updates.get(common.id)).toBe(updates.get(personal.id));
  });

  it('상위와 같은 색이던 하위는 상위의 새 색을 따라간다', () => {
    const parent = cat({ id: 'p', name: '교통', subGroup: 'variable_personal' });
    const child = cat({ name: '택시', parentCategoryId: 'p', subGroup: 'variable_personal' });
    const ownColor = cat({
      name: '주유',
      parentCategoryId: 'p',
      subGroup: 'variable_personal',
      color: '#5B8DEF',
    });
    const updates = planCategoryColorMigration([parent, child, ownColor]);
    expect(updates.get(child.id)).toBe('#6A6FD8');
    expect(updates.has(ownColor.id)).toBe(false);
  });
});
