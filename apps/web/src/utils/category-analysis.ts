import dayjs, { type Dayjs } from 'dayjs';
import type { SubGroupFilter } from '@/hooks/useDashboardData';
import type { CategoryGroup } from '@/types';

export const CATEGORY_ANALYSIS_PATH = '/inner/cashbook/analysis';

export type CategoryAnalysisParams = {
  category: string;
  group: CategoryGroup;
  subGroup: SubGroupFilter;
  /** 기준 달 (1일) */
  cursor: Dayjs;
};

const GROUPS: readonly CategoryGroup[] = ['expense', 'income'];
const SUB_GROUPS: readonly SubGroupFilter[] = ['all', 'fixed', 'variable'];

/** 대시보드 상태 → 카테고리 분석 페이지 링크. 이번 달·세부 필터 '전체'는 생략한다. */
export function buildCategoryAnalysisHref(params: CategoryAnalysisParams): string {
  const query = new URLSearchParams();
  query.set('category', params.category);
  query.set('group', params.group);
  if (params.subGroup !== 'all') query.set('sub', params.subGroup);
  const month = params.cursor.startOf('month');
  if (!month.isSame(dayjs(), 'month')) query.set('at', month.format('YYYY-MM-DD'));
  return `${CATEGORY_ANALYSIS_PATH}?${query.toString()}`;
}

/** URL 쿼리 → 분석 파라미터. 카테고리·그룹이 없거나 잘못되면 null. 미래 달은 이번 달로. */
export function parseCategoryAnalysisParams(
  query: URLSearchParams | { get(name: string): string | null }
): CategoryAnalysisParams | null {
  const category = query.get('category')?.trim();
  const group = query.get('group') as CategoryGroup | null;
  if (!category || !group || !GROUPS.includes(group)) return null;
  const sub = query.get('sub') as SubGroupFilter | null;
  const at = query.get('at');
  const parsed = at ? dayjs(at) : null;
  const cursor =
    parsed && parsed.isValid() && !parsed.isAfter(dayjs(), 'month')
      ? parsed.startOf('month')
      : dayjs().startOf('month');
  return {
    category,
    group,
    subGroup: sub && SUB_GROUPS.includes(sub) ? sub : 'all',
    cursor,
  };
}
