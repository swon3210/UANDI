import { inconsistentDecisions, promotableDecisions } from './decisions';
import { normalize } from './fingerprint';
import { newId } from './id';
import type { Masker } from './mask';
import {
  type AnyRule,
  type CategoryRule,
  type CompiledRules,
  type RulesFile,
  type UserPrinciple,
} from './rules';
import type { Suggestion } from './suggestions';

/** 이 기간 넘게 쓰이지 않은 규칙을 "안 쓰는 규칙"으로 본다 (원칙 5, 근거 E-3) */
export const UNUSED_AFTER_DAYS = 60;

export const REVIEW_FOCUSES = [
  'unused',
  'conflicts',
  'noRationale',
  'promotable',
  'inconsistent',
  'principlesWithoutRules',
  'principleConflicts',
] as const;

export type ReviewFocus = (typeof REVIEW_FOCUSES)[number];

export type PlaybookReview = {
  /** 전부. focus에 principlesWithoutRules가 있으면 ruleIds가 빈 것만 — "말로만 있는 기준" */
  principles: UserPrinciple[];
  /** 근거 E-3: UNUSED_AFTER_DAYS 넘게 적용된 적 없는(또는 마지막 적용이 그만큼 오래된) 규칙. default는 제외 */
  unused: AnyRule[];
  /** 근거 B-5: 결정 로그 sample·규칙 examples를 모든 카테고리 규칙에 대입해 둘 이상 맞는 것 */
  conflicts: { rules: string[]; sample: string }[];
  /** 근거 E-2: rationale이 비어 있는 user·promoted 규칙 id */
  noRationale: string[];
  /** 원칙 5: count>=2인데 아직 규칙이 아닌 결정 */
  promotable: Suggestion[];
  /** 원칙 4: 같은 적요를 서로 다른 카테고리로 고른 이력 */
  inconsistent: Suggestion[];
  /** 원칙 6: 저장 때 원칙과 어긋난다고 기록된 규칙 */
  principleConflicts: { ruleId: string; conflictsWith: number[] }[];
};

function daysBetween(fromIso: string, toIso: string): number {
  return (Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000;
}

/** 모든 카테고리 규칙 중 이 적요에 맞는 것 — 단계·범위(onlyFor)·카테고리 존재 여부를 따지지 않는다 */
function matchingCategoryRules(rawDescription: string, compiled: CompiledRules): CategoryRule[] {
  const key = normalize(rawDescription);
  const hit: CategoryRule[] = [];
  for (const r of compiled.categoryExact.get(key) ?? []) hit.push(r);
  for (const { rule, key: needle } of compiled.categoryContains) {
    if (key.includes(needle)) hit.push(rule);
  }
  for (const { rule, re } of compiled.categoryRegex) {
    if (re.test(rawDescription)) hit.push(rule);
  }
  return hit;
}

/**
 * 내역서 없이 기준을 점검한다 (docs/09-settle-mcp.md §11.5 review_playbook). 읽기 전용.
 * focus를 주면 그 항목만 계산하고 나머지는 빈 배열이다. 실명은 masker로 가린다.
 */
export function reviewPlaybook(
  compiled: CompiledRules,
  options: { focus?: readonly ReviewFocus[]; now?: string; masker: Masker }
): PlaybookReview {
  const file: RulesFile = compiled.file;
  const now = options.now ?? new Date().toISOString();
  // focus를 명시했을 때만 좁힌다 — 비우면 전부 계산하고 principles도 전부
  const explicit = options.focus?.length ? new Set<ReviewFocus>(options.focus) : null;
  const focus = explicit ?? new Set<ReviewFocus>(REVIEW_FOCUSES);
  const { masker } = options;
  const maskRule = (r: AnyRule): AnyRule =>
    'match' in r ? masker.categoryRule(r) : { ...masker.rule(r), pattern: masker.text(r.pattern) };

  const machineRules: AnyRule[] = [...file.categoryRules, ...file.ignore, ...file.transfer];

  const principles = explicit?.has('principlesWithoutRules')
    ? file.principles.filter((p) => p.ruleIds.length === 0)
    : file.principles;

  const unused = focus.has('unused')
    ? machineRules
        .filter((r) => r.source !== 'default')
        .filter((r) =>
          r.lastHitAt
            ? daysBetween(r.lastHitAt, now) > UNUSED_AFTER_DAYS
            : r.hits === 0 && daysBetween(r.createdAt, now) > UNUSED_AFTER_DAYS
        )
        .map(maskRule)
    : [];

  const conflicts: PlaybookReview['conflicts'] = [];
  if (focus.has('conflicts')) {
    const samples = new Set<string>();
    for (const d of file.decisions) samples.add(d.sample);
    for (const r of machineRules) for (const e of r.examples) samples.add(e);
    const seen = new Set<string>();
    for (const sample of samples) {
      const hit = matchingCategoryRules(sample, compiled);
      if (hit.length < 2) continue;
      const ids = hit.map((r) => r.id).sort();
      const signature = ids.join('|');
      if (seen.has(signature)) continue;
      seen.add(signature);
      conflicts.push({ rules: ids, sample: masker.text(sample) });
    }
  }

  const noRationale = focus.has('noRationale')
    ? machineRules
        .filter((r) => (r.source === 'user' || r.source === 'promoted') && r.rationale === null)
        .map((r) => r.id)
    : [];

  const promotable: Suggestion[] = focus.has('promotable')
    ? promotableDecisions(file).map((p) => ({
        id: newId(),
        kind: 'promote',
        ...p,
        key: masker.text(p.key),
        sample: masker.text(p.sample),
        rowIds: [],
      }))
    : [];

  const inconsistent: Suggestion[] = focus.has('inconsistent')
    ? inconsistentDecisions(file).map((i) => ({
        id: newId(),
        kind: 'inconsistent',
        ...i,
        key: masker.text(i.key),
        sample: masker.text(i.sample),
      }))
    : [];

  const principleConflicts = focus.has('principleConflicts')
    ? machineRules
        .filter((r) => r.conflictsWith.length > 0)
        .map((r) => ({ ruleId: r.id, conflictsWith: r.conflictsWith }))
    : [];

  return {
    principles,
    unused,
    conflicts,
    noRationale,
    promotable,
    inconsistent,
    principleConflicts,
  };
}
