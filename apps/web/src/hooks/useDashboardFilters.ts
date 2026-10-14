import { useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import dayjs, { type Dayjs } from 'dayjs';
import { supportsSubGroup, type GroupFilter, type SubGroupFilter } from '@/hooks/useDashboardData';
import { isCurrentPeriod, normalizeCursor, type PeriodKind } from '@/utils/date';

export type DashboardFilters = {
  period: PeriodKind;
  /** 기준 기간 커서 */
  cursor: Dayjs;
  /**
   * 반대쪽 탭(월간↔연간)에서 마지막으로 보던 기간 커서. 탭을 오갈 때 복원한다.
   * null = 아직 그 탭에서 기간을 정한 적 없음 → 현재 커서에서 파생
   */
  altCursor: Dayjs | null;
  group: GroupFilter;
  subGroup: SubGroupFilter;
  /** null = 기본(직전 기간), 값 = 사용자가 직접 고른 비교 기간 */
  compareSelection: Dayjs | null;
  /** null = 기본(그룹별 기본 선택), 배열 = 사용자가 직접 고른 비교 대상 카테고리 */
  categorySelection: string[] | null;
  /** 지출·수입 '전체' 도넛에 표시할 카테고리. 빈 배열 = 기본(고정/변동) */
  donutSelection: string[];
};

const PERIODS: readonly PeriodKind[] = ['monthly', 'yearly'];
const GROUPS: readonly GroupFilter[] = ['all', 'expense', 'income'];
const SUB_GROUPS: readonly SubGroupFilter[] = ['all', 'fixed', 'variable'];
const DATE_FORMAT = 'YYYY-MM-DD';

function parseDate(value: string | null): Dayjs | null {
  if (!value) return null;
  const date = dayjs(value);
  if (!date.isValid() || date.isAfter(dayjs(), 'day')) return null;
  return date;
}

function otherPeriod(period: PeriodKind): PeriodKind {
  return period === 'monthly' ? 'yearly' : 'monthly';
}

function parseFilters(params: URLSearchParams): DashboardFilters {
  const periodParam = params.get('period') as PeriodKind | null;
  const period = periodParam && PERIODS.includes(periodParam) ? periodParam : 'monthly';
  const at = parseDate(params.get('at'));
  const alt = parseDate(params.get('alt'));
  const groupParam = params.get('group') as GroupFilter | null;
  const group = groupParam && GROUPS.includes(groupParam) ? groupParam : 'all';
  const subParam = params.get('sub') as SubGroupFilter | null;
  const subGroup =
    supportsSubGroup(group) && subParam && SUB_GROUPS.includes(subParam) ? subParam : 'all';
  const cmp = parseDate(params.get('cmp'));

  return {
    period,
    // 기간 시작일로 맞춰 둬야 이동 후 URL의 at이 기간 시작일로 남는다
    cursor: normalizeCursor(period, at ?? dayjs()),
    altCursor: alt ? normalizeCursor(otherPeriod(period), alt) : null,
    group,
    subGroup,
    compareSelection: cmp ? normalizeCursor(period, cmp) : null,
    // 'cat' 키가 있으면 빈 값만 있어도 "직접 모두 해제"한 상태로 본다
    categorySelection: params.has('cat') ? params.getAll('cat').filter(Boolean) : null,
    donutSelection: params.getAll('donut').filter(Boolean),
  };
}

function serializeFilters(f: DashboardFilters): string {
  const params = new URLSearchParams();
  if (f.period !== 'monthly') params.set('period', f.period);
  if (!isCurrentPeriod(f.period, f.cursor)) params.set('at', f.cursor.format(DATE_FORMAT));
  if (f.group !== 'all') params.set('group', f.group);
  if (f.subGroup !== 'all') params.set('sub', f.subGroup);
  if (f.compareSelection) params.set('cmp', f.compareSelection.format(DATE_FORMAT));
  if (f.categorySelection) {
    if (f.categorySelection.length === 0) params.set('cat', '');
    for (const name of f.categorySelection) params.append('cat', name);
  }
  for (const name of f.donutSelection) params.append('donut', name);
  // 반대쪽 탭에서 보던 기간(탭 전환 시 복원용)은 부가 정보라 맨 뒤에 둔다
  if (f.altCursor) params.set('alt', f.altCursor.format(DATE_FORMAT));
  return params.toString();
}

/**
 * 대시보드 필터(기간·그룹·세부 필터·비교 기간·선택 카테고리)를 URL 쿼리에 저장한다.
 * 다른 페이지에 다녀와도(뒤로 가기·탭 이동) 필터가 초기화되지 않게 하기 위함이다.
 *
 * 연속 클릭에도 변경이 유실되지 않도록 필터는 React 상태로 들고(즉시 반영),
 * URL은 상태를 따라가게 동기화한다. (URL 반영은 렌더 이후라 URL을 원본으로 쓰면
 * 반영 전 다음 클릭이 이전 값을 덮어쓴다)
 */
export function useDashboardFilters(): [
  DashboardFilters,
  (patch: Partial<DashboardFilters>) => void,
] {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.toString();

  // 마운트 시점의 URL 쿼리로 시작한다 (쿼리가 없으면 기본값)
  const [filters, setFilters] = useState<DashboardFilters>(() =>
    parseFilters(new URLSearchParams(urlQuery))
  );

  const update = useCallback((patch: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  // 외부 시스템(URL)을 필터 상태에 맞춘다
  const query = serializeFilters(filters);
  useEffect(() => {
    if (query !== urlQuery) {
      // router.replace는 서버 왕복이 있는 내비게이션이라 연속 변경 시 서로 경합해
      // 히스토리 항목에 중간 상태가 남는다(뒤로 가기 시 필터 일부 유실). URL만 바꾸는
      // history.replaceState를 쓴다 — Next.js가 useSearchParams와 동기화해 준다.
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
    }
  }, [query, urlQuery, pathname]);

  return [filters, update];
}
