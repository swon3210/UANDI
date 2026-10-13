import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dayjs, { type Dayjs } from 'dayjs';
import { supportsSubGroup, type GroupFilter, type SubGroupFilter } from '@/hooks/useDashboardData';
import { isCurrentPeriod, normalizeCursor, type PeriodKind } from '@/utils/date';

export type DashboardFilters = {
  period: PeriodKind;
  /** 기준 기간 커서 */
  cursor: Dayjs;
  group: GroupFilter;
  subGroup: SubGroupFilter;
  /** null = 기본(직전 기간), 값 = 사용자가 직접 고른 비교 기간 */
  compareSelection: Dayjs | null;
  /** null = 기본(그룹별 기본 선택), 배열 = 사용자가 직접 고른 비교 대상 카테고리 */
  categorySelection: string[] | null;
  /** 지출·수입 '전체' 도넛에 표시할 카테고리. 빈 배열 = 기본(고정/변동) */
  donutSelection: string[];
};

const PERIODS: readonly PeriodKind[] = ['weekly', 'monthly', 'yearly'];
const GROUPS: readonly GroupFilter[] = ['all', 'expense', 'income', 'flex'];
const SUB_GROUPS: readonly SubGroupFilter[] = ['all', 'fixed', 'variable'];
const DATE_FORMAT = 'YYYY-MM-DD';

// 다른 페이지에 갔다가 탭·사이드바(쿼리 없는 링크)로 돌아와도 필터가 남도록 마지막 쿼리를 기억한다.
const STORAGE_KEY = 'uandi:dashboard-filters';

function readStoredQuery(): string {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeStoredQuery(query: string) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, query);
  } catch {
    // 저장소를 쓸 수 없으면 URL만으로 유지한다
  }
}

function parseDate(value: string | null): Dayjs | null {
  if (!value) return null;
  const date = dayjs(value);
  if (!date.isValid() || date.isAfter(dayjs(), 'day')) return null;
  return date;
}

function parseFilters(params: URLSearchParams): DashboardFilters {
  const periodParam = params.get('period') as PeriodKind | null;
  const period = periodParam && PERIODS.includes(periodParam) ? periodParam : 'weekly';
  const at = parseDate(params.get('at'));
  const groupParam = params.get('group') as GroupFilter | null;
  const group = groupParam && GROUPS.includes(groupParam) ? groupParam : 'all';
  const subParam = params.get('sub') as SubGroupFilter | null;
  const subGroup =
    supportsSubGroup(group) && subParam && SUB_GROUPS.includes(subParam) ? subParam : 'all';
  const cmp = parseDate(params.get('cmp'));

  return {
    period,
    cursor: at ? normalizeCursor(period, at) : dayjs(),
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
  if (f.period !== 'weekly') params.set('period', f.period);
  if (!isCurrentPeriod(f.period, f.cursor)) params.set('at', f.cursor.format(DATE_FORMAT));
  if (f.group !== 'all') params.set('group', f.group);
  if (f.subGroup !== 'all') params.set('sub', f.subGroup);
  if (f.compareSelection) params.set('cmp', f.compareSelection.format(DATE_FORMAT));
  if (f.categorySelection) {
    if (f.categorySelection.length === 0) params.set('cat', '');
    for (const name of f.categorySelection) params.append('cat', name);
  }
  for (const name of f.donutSelection) params.append('donut', name);
  return params.toString();
}

/**
 * 대시보드 필터(기간·그룹·세부 필터·비교 기간·선택 카테고리)를 URL 쿼리에 저장한다.
 * 다른 페이지에 다녀와도(뒤로 가기·탭 이동) 필터가 초기화되지 않게 하기 위함이다.
 * URL에 필터가 없으면 이번 세션에서 마지막으로 쓴 필터를 이어서 쓴다.
 *
 * 연속 클릭에도 변경이 유실되지 않도록 필터는 React 상태로 들고(즉시 반영),
 * URL·sessionStorage는 상태를 따라가게 동기화한다. (router.replace는 비동기라 URL을 원본으로 쓰면
 * 반영 전 다음 클릭이 이전 값을 덮어쓴다)
 */
export function useDashboardFilters(): [
  DashboardFilters,
  (patch: Partial<DashboardFilters>) => void,
] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.toString();

  // 마운트 시점의 URL(없으면 세션에 기억한 값)로 시작한다
  const [filters, setFilters] = useState<DashboardFilters>(() =>
    parseFilters(new URLSearchParams(urlQuery || readStoredQuery()))
  );

  const update = useCallback((patch: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  // 외부 시스템(URL·sessionStorage)을 필터 상태에 맞춘다
  const query = serializeFilters(filters);
  useEffect(() => {
    writeStoredQuery(query);
    if (query !== urlQuery) {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [query, urlQuery, pathname, router]);

  return [filters, update];
}
