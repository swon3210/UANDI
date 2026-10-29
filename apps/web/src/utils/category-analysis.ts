import dayjs, { type Dayjs } from 'dayjs';
import type { SubGroupFilter } from '@/hooks/useDashboardData';
import type { CategoryGroup } from '@/types';

export const CATEGORY_ANALYSIS_PATH = '/inner/cashbook/analysis';

/** 비교 대상: 'median' = 평소(최근 달 중위값), Dayjs = 그 달 */
export type CategoryAnalysisCompare = Dayjs | 'median';

export type CategoryAnalysisParams = {
  group: CategoryGroup;
  subGroup: SubGroupFilter;
  /** 종합 분석할 카테고리. 빈 배열 = 그룹·세부 필터 범위 전체 */
  categories: string[];
  /** 기준 달 (1일) */
  cursor: Dayjs;
  /** 대시보드 기간 비교에서 고른 비교 대상 (기본: 전월) */
  compare: CategoryAnalysisCompare;
};

const GROUPS: readonly CategoryGroup[] = ['expense', 'income'];
const SUB_GROUPS: readonly SubGroupFilter[] = ['all', 'fixed', 'variable'];
const DATE_FORMAT = 'YYYY-MM-DD';

function parseMonth(value: string | null): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() && !parsed.isAfter(dayjs(), 'month') ? parsed.startOf('month') : null;
}

/** 대시보드 상태 → 분석 페이지 링크. 이번 달·세부 필터 '전체'·전월 비교·카테고리 전체는 생략한다. */
export function buildCategoryAnalysisHref(params: CategoryAnalysisParams): string {
  const query = new URLSearchParams();
  query.set('group', params.group);
  if (params.subGroup !== 'all') query.set('sub', params.subGroup);
  const month = params.cursor.startOf('month');
  if (!month.isSame(dayjs(), 'month')) query.set('at', month.format(DATE_FORMAT));
  for (const name of params.categories) query.append('cat', name);
  if (params.compare === 'median') query.set('cmp', 'median');
  else if (!params.compare.isSame(month.subtract(1, 'month'), 'month'))
    query.set('cmp', params.compare.startOf('month').format(DATE_FORMAT));
  return `${CATEGORY_ANALYSIS_PATH}?${query.toString()}`;
}

/** URL 쿼리 → 분석 파라미터. 그룹이 없거나 잘못되면 null. 미래 달은 이번 달로. */
export function parseCategoryAnalysisParams(
  query: URLSearchParams | { get(name: string): string | null; getAll(name: string): string[] }
): CategoryAnalysisParams | null {
  const group = query.get('group') as CategoryGroup | null;
  if (!group || !GROUPS.includes(group)) return null;
  const sub = query.get('sub') as SubGroupFilter | null;
  const cursor = parseMonth(query.get('at')) ?? dayjs().startOf('month');
  const cmp = query.get('cmp');
  const categories = [
    ...new Set(
      query
        .getAll('cat')
        .map((name) => name.trim())
        .filter(Boolean)
    ),
  ];
  return {
    group,
    subGroup: sub && SUB_GROUPS.includes(sub) ? sub : 'all',
    categories,
    cursor,
    compare: cmp === 'median' ? 'median' : (parseMonth(cmp) ?? cursor.subtract(1, 'month')),
  };
}

const GROUP_NAME: Record<CategoryGroup, string> = { expense: '지출', income: '수입' };
const SUB_GROUP_PREFIX: Record<SubGroupFilter, string> = {
  all: '',
  fixed: '고정 ',
  variable: '변동 ',
};

/**
 * 분석 범위 이름. `title`은 화면 제목(카테고리 1개면 그 이름, 여러 개면 `선택한 카테고리 N개`),
 * `scope`는 AI에 넘기는 이름(카테고리 이름들). 고른 게 없으면 둘 다 `전체 변동 지출` 같은 범위.
 */
export function analysisScopeName(params: CategoryAnalysisParams): {
  title: string;
  scope: string;
} {
  if (params.categories.length === 0) {
    const all = `전체 ${SUB_GROUP_PREFIX[params.subGroup]}${GROUP_NAME[params.group]}`;
    return { title: all, scope: all };
  }
  return {
    title:
      params.categories.length === 1
        ? params.categories[0]
        : `선택한 카테고리 ${params.categories.length}개`,
    scope: params.categories.join('·'),
  };
}

/**
 * AI 리포트 마크다운에서 `## 📊 요약` 섹션 본문만 꺼낸다 (스트리밍 중이면 받은 데까지).
 * 요약 제목을 못 찾으면 첫 섹션 본문을 쓴다. `complete`는 다음 섹션이 시작돼 요약이 다 들어왔는지.
 */
export function extractReportSummary(markdown: string): { text: string; complete: boolean } {
  const sections = markdown.split(/^##\s+/m).slice(1);
  const index = sections.findIndex((s) => s.split('\n', 1)[0].includes('요약'));
  const at = index === -1 ? 0 : index;
  const section = sections[at];
  if (!section) return { text: '', complete: false };
  const newline = section.indexOf('\n');
  return {
    text: newline === -1 ? '' : section.slice(newline + 1).trim(),
    complete: at < sections.length - 1,
  };
}
