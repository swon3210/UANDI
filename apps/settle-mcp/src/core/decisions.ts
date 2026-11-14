import { normalize } from './fingerprint';
import type { Decision, RulesFile } from './rules';

/** 결정 로그 상한 (docs/09-settle-mcp.md §10 #9). 넘으면 오래된 것부터 버린다 */
export const MAX_DECISIONS = 1000;
/** 같은 결정을 이만큼 했으면 규칙으로 올리자고 제안한다 (원칙 5) */
export const PROMOTE_THRESHOLD = 2;

export type PromotableDecision = Pick<Decision, 'key' | 'sample' | 'category' | 'count'>;

/**
 * 사용자가 set_category로 카테고리를 고른 결정을 집계한다. 같은 key·category면 count+1,
 * 같은 key의 다른 category는 따로 남겨 둔다(다음 stage에서 inconsistent 제안의 재료).
 * 원본은 바꾸지 않는다.
 */
export function recordDecision(
  file: RulesFile,
  input: { rawDescription: string; category: string; batchId: string },
  now: string = new Date().toISOString()
): { file: RulesFile; decision: Decision } {
  const key = normalize(input.rawDescription);
  const next = structuredClone(file);
  let decision = next.decisions.find((d) => d.key === key && d.category === input.category);
  if (decision) {
    decision.count += 1;
    decision.lastAt = now;
    decision.lastBatchId = input.batchId;
    decision.sample = input.rawDescription;
  } else {
    decision = {
      key,
      sample: input.rawDescription,
      category: input.category,
      count: 1,
      lastAt: now,
      lastBatchId: input.batchId,
    };
    next.decisions.push(decision);
  }
  if (next.decisions.length > MAX_DECISIONS) {
    next.decisions.sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
    next.decisions.length = MAX_DECISIONS;
  }
  return { file: next, decision };
}

/** 규칙으로 올릴 만한 결정 — count가 임계 이상이고 아직 exact 규칙이 없는 key */
export function promotableDecisions(file: RulesFile): PromotableDecision[] {
  const ruled = new Set(
    file.categoryRules
      .filter((r) => r.match.kind === 'exact')
      .map((r) => (r.match.kind === 'exact' ? normalize(r.match.key) : ''))
  );
  return file.decisions
    .filter((d) => d.count >= PROMOTE_THRESHOLD && !ruled.has(d.key))
    .map(({ key, sample, category, count }) => ({ key, sample, category, count }));
}

/** 같은 적요를 서로 다른 카테고리로 고른 이력 (원칙 4) */
export function inconsistentDecisions(
  file: RulesFile
): { key: string; sample: string; categories: string[] }[] {
  const byKey = new Map<string, Decision[]>();
  for (const d of file.decisions) {
    const list = byKey.get(d.key);
    if (list) list.push(d);
    else byKey.set(d.key, [d]);
  }
  return [...byKey.entries()]
    .filter(([, list]) => new Set(list.map((d) => d.category)).size > 1)
    .map(([key, list]) => ({
      key,
      sample: list[0]!.sample,
      categories: [...new Set(list.map((d) => d.category))],
    }));
}
