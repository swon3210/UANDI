import dayjs, { type Dayjs } from 'dayjs';
import { buildRecurrenceOccurrences, recurrenceMonthKey } from '@/utils/cashflow';
import type { CashbookCategory, CashbookEntry, CategoryGroup } from '@/types';

// 대시보드 월간 탭의 "이달 예정 고정 지출·수입" 순수 계산 (firebase 비의존).
// 명세: docs/pages/02-dashboard.md "이달 예정 고정 지출·수입".
// 발생일·금액의 단일 출처는 카테고리 recurrence이고(cashflow-recurrence-integration.md D1),
// 발생일 계산은 현금흐름 캘린더와 같은 buildRecurrenceOccurrences를 재사용한다.

export type UpcomingFixedItem = {
  categoryId: string;
  category: string;
  type: CategoryGroup;
  amount: number;
  date: Date;
  /** 발생 근거 라벨 (formatRecurrence, 예: "매월 25일") */
  note: string;
  icon: string;
  color: string;
};

export type UpcomingFixedTotals = {
  count: number;
  amount: number;
};

export type UpcomingFixed = {
  /** 오늘 포함 이달 남은 발생분 중 아직 기록되지 않은 항목 (발생일 오름차순) */
  items: UpcomingFixedItem[];
  /** 발생일이 이미 지났는데 이달 기록이 없는 항목. 합계에는 넣지 않고 따로 알려준다 */
  overdue: UpcomingFixedItem[];
  /** items 기준 그룹별 건수·금액 */
  totals: Record<CategoryGroup, UpcomingFixedTotals>;
};

const EMPTY_TOTALS = (): Record<CategoryGroup, UpcomingFixedTotals> => ({
  expense: { count: 0, amount: 0 },
  income: { count: 0, amount: 0 },
});

function sumTotals(items: UpcomingFixedItem[]): Record<CategoryGroup, UpcomingFixedTotals> {
  const totals = EMPTY_TOTALS();
  for (const item of items) {
    totals[item.type].count += 1;
    totals[item.type].amount += item.amount;
  }
  return totals;
}

/**
 * 이달(today가 속한 달)의 고정 지출·수입 발생분 중 아직 기록되지 않은 것을 모은다.
 * - 포함 조건은 buildRecurrenceOccurrences와 같다: recurrence.enabled + expectedAmount > 0.
 *   (금액 미상인 정기 항목은 알림만 받고 예정 금액에는 들어가지 않는다)
 * - G1: 같은 달에 같은 카테고리(이름) 실거래가 1건이라도 있으면 그 달 발생분은 제외한다.
 *   현금흐름 캘린더·내역 프롬프트와 같은 규칙이라 세 화면의 숫자가 어긋나지 않는다.
 * - 발생일이 오늘 이후(오늘 포함)면 items, 이미 지났으면 overdue로 나눈다.
 *   지난 발생분을 합계에 넣으면 해지한 구독이 계속 지출로 잡히므로 알림만 한다.
 */
export function buildUpcomingFixed(
  categories: CashbookCategory[],
  monthEntries: CashbookEntry[],
  today: Dayjs
): UpcomingFixed {
  const monthStart = today.startOf('month');
  const todayStart = today.startOf('day');

  const occurrences = buildRecurrenceOccurrences(categories, {
    from: monthStart,
    months: 1,
  }).filter((o) => dayjs(o.date).isSame(monthStart, 'month'));

  const actualKeys = new Set<string>();
  for (const e of monthEntries) actualKeys.add(recurrenceMonthKey(e.category, e.date.toDate()));

  const byId = new Map(categories.map((c) => [c.id, c]));
  const items: UpcomingFixedItem[] = [];
  const overdue: UpcomingFixedItem[] = [];

  for (const o of occurrences) {
    if (actualKeys.has(recurrenceMonthKey(o.categoryName, o.date))) continue; // G1
    const category = byId.get(o.categoryId);
    const item: UpcomingFixedItem = {
      categoryId: o.categoryId,
      category: o.categoryName,
      type: o.type,
      amount: o.amount,
      date: o.date,
      note: o.note,
      icon: category?.icon ?? '',
      color: category?.color ?? '',
    };
    if (dayjs(o.date).isBefore(todayStart, 'day')) overdue.push(item);
    else items.push(item);
  }

  return { items, overdue, totals: sumTotals(items) };
}

/**
 * 대시보드 탭(그룹·세부 필터·도넛 카테고리 선택)에 맞춰 예정 항목을 추린다.
 * - types: 보여줄 그룹. 변동 탭처럼 예정 개념이 없는 화면은 빈 배열을 넘긴다.
 * - categoryNames: 도넛에서 카테고리를 골랐으면 그 이름들만 (null = 제한 없음).
 */
export function pickUpcomingFixed(
  upcoming: UpcomingFixed,
  types: readonly CategoryGroup[],
  categoryNames: readonly string[] | null
): UpcomingFixed {
  const keep = (item: UpcomingFixedItem) =>
    types.includes(item.type) && (categoryNames === null || categoryNames.includes(item.category));
  const items = upcoming.items.filter(keep);
  return {
    items,
    overdue: upcoming.overdue.filter(keep),
    totals: sumTotals(items),
  };
}

export function isUpcomingFixedEmpty(upcoming: UpcomingFixed | null): boolean {
  return !upcoming || (upcoming.items.length === 0 && upcoming.overdue.length === 0);
}

/**
 * 예정 항목을 바로 기록할 수 있는 가계부 내역 딥링크(quickAdd).
 * 정기 알림 푸시가 여는 것과 같은 링크라 내역 페이지의 기존 처리기를 그대로 탄다.
 */
export function buildQuickAddHref(item: UpcomingFixedItem): string {
  const params = new URLSearchParams();
  params.set('quickAdd', '1');
  params.set('qaType', item.type);
  params.set('qaCategory', item.category);
  params.set('qaAmount', String(item.amount));
  return `/inner/cashbook/history?${params.toString()}`;
}
