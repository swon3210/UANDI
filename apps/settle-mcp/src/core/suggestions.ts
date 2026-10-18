import { inconsistentDecisions, promotableDecisions } from './decisions';
import { normalize } from './fingerprint';
import { newId } from './id';
import type { Decision, RulesFile } from './rules';
import type { StagedTransaction } from './types';

/** 금액 상위 몇 건까지 "규칙 없는 큰 금액"으로 짚나 (근거 A-3) */
export const BIG_UNRULED_TOP = 10;

export type Suggestion =
  /** 원칙 5: 이 적요를 과거 count번 같은 카테고리로 손으로 골랐다. 이번 배치의 rowIds에도 있다 */
  | {
      id: string;
      kind: 'promote';
      key: string;
      sample: string;
      category: string;
      count: number;
      rowIds: string[];
    }
  /** 이번 행의 카테고리가 비어 있거나 LLM 추정인데, 결정 로그에 같은 적요가 있다 → "지난달엔 X로 하셨어요" */
  | { id: string; kind: 'pastDecision'; rowId: string; category: string; count: number }
  /** 원칙 4: 같은 적요를 서로 다른 카테고리로 고른 이력이 있다 */
  | { id: string; kind: 'inconsistent'; key: string; sample: string; categories: string[] }
  /** 근거 A-3: 금액 상위 BIG_UNRULED_TOP건 중 규칙 없이 LLM 추정(또는 빈 칸)에 맡겨진 행 */
  | { id: string; kind: 'bigUnruled'; rowId: string; amount: number };

export type SuggestionBuild = {
  suggestions: Suggestion[];
  /** 행 id → 그 행에 붙은 제안 id들 (StagedTransaction.suggestionIds) */
  byRow: Map<string, string[]>;
};

/**
 * 스테이징된 행과 결정 로그·규칙에서 제안을 만든다 (docs/09-settle-mcp.md §11.5).
 * 서버는 제안까지만 한다 — 자동으로 카테고리를 바꾸거나 규칙을 만들지 않는다.
 * 순서: promote → pastDecision → inconsistent → bigUnruled. 같은 종류 안에서는 금액 큰 행부터.
 */
export function buildSuggestions(rows: StagedTransaction[], file: RulesFile): SuggestionBuild {
  const suggestions: Suggestion[] = [];
  const byRow = new Map<string, string[]>();
  const attach = (rowId: string, suggestionId: string) => {
    const list = byRow.get(rowId);
    if (list) list.push(suggestionId);
    else byRow.set(rowId, [suggestionId]);
  };

  const live = rows
    .filter((r) => r.status !== 'ignored')
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
  const rowsByKey = new Map<string, StagedTransaction[]>();
  for (const row of live) {
    const key = normalize(row.rawDescription);
    const list = rowsByKey.get(key);
    if (list) list.push(row);
    else rowsByKey.set(key, [row]);
  }

  // 1) promote — 이번 배치에 있는 적요만
  for (const p of promotableDecisions(file)) {
    const hit = rowsByKey.get(p.key);
    if (!hit) continue;
    const s: Suggestion = { id: newId(), kind: 'promote', ...p, rowIds: hit.map((r) => r.id) };
    suggestions.push(s);
    for (const r of hit) attach(r.id, s.id);
  }

  // 2) pastDecision — 카테고리가 비었거나 LLM 추정인 행에, 가장 많이 고른 과거 결정을 붙인다
  const bestDecision = new Map<string, Decision>();
  for (const d of file.decisions) {
    const cur = bestDecision.get(d.key);
    if (!cur || d.count > cur.count || (d.count === cur.count && d.lastAt > cur.lastAt)) {
      bestDecision.set(d.key, d);
    }
  }
  for (const row of live) {
    if (row.categorySource === 'rule' || row.categorySource === 'user') continue;
    const d = bestDecision.get(normalize(row.rawDescription));
    if (!d || d.category === row.category) continue;
    const s: Suggestion = {
      id: newId(),
      kind: 'pastDecision',
      rowId: row.id,
      category: d.category,
      count: d.count,
    };
    suggestions.push(s);
    attach(row.id, s.id);
  }

  // 3) inconsistent — 이번 배치에 있는 적요만
  for (const inc of inconsistentDecisions(file)) {
    const hit = rowsByKey.get(inc.key);
    if (!hit) continue;
    const s: Suggestion = { id: newId(), kind: 'inconsistent', ...inc };
    suggestions.push(s);
    for (const r of hit) attach(r.id, s.id);
  }

  // 4) bigUnruled — 금액 상위 N건 중 규칙이 정하지 않은 카테고리
  for (const row of live.slice(0, BIG_UNRULED_TOP)) {
    if (row.categorySource === 'rule') continue;
    const s: Suggestion = { id: newId(), kind: 'bigUnruled', rowId: row.id, amount: row.amount };
    suggestions.push(s);
    attach(row.id, s.id);
  }

  return { suggestions, byRow };
}
