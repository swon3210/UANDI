import type { Dayjs } from 'dayjs';
import type { CategoryGroup } from '@/types';

export const HISTORY_PATH = '/inner/cashbook/history';

/** 내역 페이지 기간: 한 달(월 스테퍼 사용 가능) 또는 임의 기간 */
export type HistoryLinkPeriod =
  | { kind: 'month'; cursor: Dayjs }
  | { kind: 'range'; start: Dayjs; end: Dayjs };

/**
 * 대시보드 상태 → 내역 페이지 딥링크. 내역 페이지는 최초 렌더에서 한 번만 필터로 반영한다.
 * - 한 달: `?year=&month=`(0-based) / 임의 기간: `?start=&end=`
 * - `type`: 지출·수입 타입 필터, `category`(반복): 카테고리 필터 (빈 배열이면 생략)
 */
export function buildHistoryHref(args: {
  period: HistoryLinkPeriod;
  type: CategoryGroup;
  categories?: readonly string[];
}): string {
  const { period, type, categories = [] } = args;
  const params = new URLSearchParams();
  if (period.kind === 'month') {
    params.set('year', String(period.cursor.year()));
    params.set('month', String(period.cursor.month()));
  } else {
    params.set('start', period.start.format('YYYY-MM-DD'));
    params.set('end', period.end.format('YYYY-MM-DD'));
  }
  params.set('type', type);
  for (const name of categories) params.append('category', name);
  return `${HISTORY_PATH}?${params.toString()}`;
}
