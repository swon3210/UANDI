import { promotableDecisions } from './decisions';
import { normalize } from './fingerprint';
import { newId } from './id';
import { allRules, type RulesFile } from './rules';
import type { Suggestion } from './suggestions';
import type { StagedTransaction } from './types';

/** 회고에서 "규칙 없이 추정에 맡긴 큰 금액"을 몇 건 보여 주나 (근거 A-3) */
export const UNRULED_TOP = 5;

export type Retrospective = {
  /** 커밋(예정) 행의 카테고리가 어디서 왔나 */
  byCategorySource: { rule: number; llm: number; user: number };
  /** categorySource==='user'인 행 수 = 손으로 고친 건수 */
  userOverrides: number;
  /** 배치 생성 이후 save_rule로 늘어난 기계 규칙 수 (Batch.rulesAtStart와 비교) */
  rulesSavedDuringBatch: number;
  /** 아직 규칙으로 안 올린 count>=2 결정 (원칙 5). 이번 배치에 있는 행이면 rowIds에 */
  promotable: Suggestion[];
  /** LLM 추정에 맡겨진 행 중 금액 상위 UNRULED_TOP건 */
  unruledTop: { rowId: string; description: string; amount: number; category: string }[];
  /** 이번 배치가 건드린 원칙 번호(1~6). 무시 행이 있으면 2, 송금 보류가 있으면 3, 적용된 규칙의 conflictsWith */
  principlesTouched: number[];
};

/** 기계 규칙 수 — rulesAtStart·rulesSavedDuringBatch의 단위 */
export function machineRuleCount(file: RulesFile): number {
  return allRules(file).length;
}

/**
 * 커밋 직전(dryRun 포함) 회고 (docs/09-settle-mcp.md §11.5 commit_batch).
 * rows는 배치의 모든 행, committable은 이번에 쓸(쓴) 행. 원본은 바꾸지 않는다.
 */
export function buildRetrospective(input: {
  rows: StagedTransaction[];
  committable: StagedTransaction[];
  file: RulesFile;
  rulesAtStart: number | null;
}): Retrospective {
  const { rows, committable, file } = input;

  const byCategorySource = { rule: 0, llm: 0, user: 0 };
  for (const r of committable) {
    if (r.categorySource === 'rule' || r.categorySource === 'llm' || r.categorySource === 'user') {
      byCategorySource[r.categorySource] += 1;
    }
  }

  const current = machineRuleCount(file);
  const rulesSavedDuringBatch =
    input.rulesAtStart === null ? 0 : Math.max(0, current - input.rulesAtStart);

  const rowsByKey = new Map<string, string[]>();
  for (const r of rows) {
    const key = normalize(r.rawDescription);
    const list = rowsByKey.get(key);
    if (list) list.push(r.id);
    else rowsByKey.set(key, [r.id]);
  }
  const promotable: Suggestion[] = promotableDecisions(file).map((p) => ({
    id: newId(),
    kind: 'promote',
    ...p,
    rowIds: rowsByKey.get(p.key) ?? [],
  }));

  const unruledTop = committable
    .filter((r) => r.categorySource !== 'rule' && r.category)
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id))
    .slice(0, UNRULED_TOP)
    .map((r) => ({
      rowId: r.id,
      description: r.description,
      amount: r.amount,
      category: r.category!,
    }));

  const touched = new Set<number>();
  if (rows.some((r) => r.status === 'ignored')) touched.add(2);
  if (rows.some((r) => r.status === 'transfer')) touched.add(3);
  const ruleById = new Map(allRules(file).map((r) => [r.id, r]));
  for (const r of committable) {
    if (!r.appliedRuleId) continue;
    for (const no of ruleById.get(r.appliedRuleId)?.conflictsWith ?? []) touched.add(no);
  }

  return {
    byCategorySource,
    userOverrides: byCategorySource.user,
    rulesSavedDuringBatch,
    promotable,
    unruledTop,
    principlesTouched: [...touched].sort((a, b) => a - b),
  };
}
