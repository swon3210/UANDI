import dayjs, { type Dayjs } from 'dayjs';
import type { CashbookEntry, CashbookEntryType } from '@/types';

// 자동 예측 감지(§7) 순수 유틸 — firebase 비의존.

export type RecurringPattern = {
  category: string;
  type: CashbookEntryType;
  dayOfMonth: number; // 대표 발생일 (1~31)
  amount: number; // 대표 금액(평균, 반올림)
  occurrences: number; // 반복된 '서로 다른 달' 수
};

const MIN_OCCURRENCES = 3; // 3회 이상 반복
const AMOUNT_TOLERANCE = 0.1; // ±10%
const DAY_TOLERANCE = 2; // ±2일

function dom(e: CashbookEntry): number {
  return dayjs(e.date.toDate()).date();
}
function ym(e: CashbookEntry): string {
  return dayjs(e.date.toDate()).format('YYYY-MM');
}

/**
 * §7-1: 같은 카테고리 + 금액 ±10% + 일자 ±2일이 3개 이상의 서로 다른 달에 반복되면 패턴으로 본다.
 * 카테고리(타입+이름)당 가장 강한 클러스터 1개를 반환. flex는 제외(고정지출/정기수입 대상).
 */
export function detectRecurringPatterns(entries: CashbookEntry[]): RecurringPattern[] {
  const groups = new Map<string, CashbookEntry[]>();
  for (const e of entries) {
    if (e.type === 'flex') continue;
    const key = `${e.type}|${e.category}`;
    const arr = groups.get(key);
    if (arr) arr.push(e);
    else groups.set(key, [e]);
  }

  const patterns: RecurringPattern[] = [];
  for (const list of groups.values()) {
    const best = bestCluster(list);
    if (best) patterns.push(best);
  }
  return patterns;
}

function bestCluster(list: CashbookEntry[]): RecurringPattern | null {
  let best: RecurringPattern | null = null;
  const candidateDays = [...new Set(list.map(dom))];

  for (const d of candidateDays) {
    const near = list.filter((e) => Math.abs(dom(e) - d) <= DAY_TOLERANCE);
    if (near.length < MIN_OCCURRENCES) continue;

    const amounts = near.map((e) => e.amount).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    const within = near.filter((e) => Math.abs(e.amount - median) <= median * AMOUNT_TOLERANCE);

    const months = new Set(within.map(ym));
    if (months.size < MIN_OCCURRENCES) continue;

    if (!best || months.size > best.occurrences) {
      best = {
        category: within[0].category,
        type: within[0].type,
        dayOfMonth: Math.round(within.reduce((s, e) => s + dom(e), 0) / within.length),
        amount: Math.round(within.reduce((s, e) => s + e.amount, 0) / within.length),
        occurrences: months.size,
      };
    }
  }
  return best;
}

/** 패턴 식별 키. 30일 거절 게이트·중복 생성 방지에 사용. */
export function buildRecurrenceKey(p: {
  category: string;
  type: CashbookEntryType;
  dayOfMonth: number;
}): string {
  return `${p.type}|${p.category}|${p.dayOfMonth}`;
}

/**
 * §7-2: 최근 months개월의 일평균 변동지출 추정. 고정지출(감지된 패턴)·수입은 제외.
 * 캘린더 카드의 "예상 변동지출" 표시용(잔액 계산에는 미반영).
 */
export function estimateVariableDaily(entries: CashbookEntry[], months: number): number {
  if (entries.length === 0) return 0;
  const fixed = new Set(detectRecurringPatterns(entries).map((p) => `${p.type}|${p.category}`));
  const from = dayjs().subtract(months, 'month').startOf('day');
  const days = Math.max(1, dayjs().startOf('day').diff(from, 'day'));

  let sum = 0;
  for (const e of entries) {
    if (e.type === 'income') continue;
    if (fixed.has(`${e.type}|${e.category}`)) continue;
    sum += e.amount;
  }
  return Math.round(sum / days);
}

/** dayOfMonth의 다음 발생일(오늘 이후, 오늘 포함). 말일 clamp. */
export function nextOccurrence(dayOfMonth: number, base: Dayjs = dayjs()): Date {
  const todayStart = base.startOf('day');
  let d = base.date(Math.min(dayOfMonth, base.daysInMonth())).startOf('day');
  if (d.isBefore(todayStart, 'day')) {
    const nm = base.add(1, 'month');
    d = nm.date(Math.min(dayOfMonth, nm.daysInMonth())).startOf('day');
  }
  return d.toDate();
}
