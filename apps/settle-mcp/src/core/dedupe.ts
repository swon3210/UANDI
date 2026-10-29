import type { ExistingEntry } from './types';

export type DedupeInput = {
  date: string;
  amount: number;
  fingerprint: string;
};

/**
 * 배치 내 지문 충돌 — 뒤에 온 것을 버린다 (§4.3).
 * 한 PDF를 두 번 넣거나 LLM이 행을 중복 출력한 경우만 잡는다.
 */
export function dedupeWithinBatch<T extends { fingerprint: string }>(
  rows: T[]
): { kept: T[]; dropped: T[] } {
  const seen = new Set<string>();
  const kept: T[] = [];
  const dropped: T[] = [];
  for (const row of rows) {
    if (seen.has(row.fingerprint)) {
      dropped.push(row);
      continue;
    }
    seen.add(row.fingerprint);
    kept.push(row);
  }
  return { kept, dropped };
}

/**
 * 기존 Firestore 내역과의 중복 — 날짜(YYYY-MM-DD)+금액만 본다. 적요는 비교하지 않는다.
 * apps/web의 findDuplicate와 같은 규칙. 과거에 손으로 넣은 내역은 적요가 제멋대로라 적요 비교는 중복을 놓친다.
 *
 * 같은 배치의 여러 행이 같은 기존 내역에 매칭되지 않도록, 한 번 매칭된 기존 내역은 소비된다.
 * (같은 날 같은 금액 2건이 내역서에 있고 기존에 1건만 있으면 하나만 중복으로 잡힌다)
 */
export function createExistingMatcher(existing: ExistingEntry[]) {
  const pool = new Map<string, ExistingEntry[]>();
  for (const e of existing) {
    const key = `${e.date}|${e.amount}`;
    const list = pool.get(key);
    if (list) list.push(e);
    else pool.set(key, [e]);
  }
  return {
    /** 매칭되면 그 기존 내역 ID를 돌려주고 풀에서 뺀다. 없으면 null */
    take(row: { date: string; amount: number }): string | null {
      const list = pool.get(`${row.date}|${row.amount}`);
      if (!list || list.length === 0) return null;
      const hit = list.shift()!;
      return hit.id;
    },
  };
}

/** 대조 범위: 스테이징 날짜의 (최소−1일) ~ (최대+1일). 기존 useDuplicateScopeEntries와 동일 */
export function duplicateScope(dates: string[]): { start: string; end: string } | null {
  if (dates.length === 0) return null;
  const sorted = [...dates].sort();
  return { start: shiftDay(sorted[0]!, -1), end: shiftDay(sorted[sorted.length - 1]!, 1) };
}

function shiftDay(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
