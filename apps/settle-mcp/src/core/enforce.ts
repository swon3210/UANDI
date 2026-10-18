import { createExistingMatcher } from './dedupe';
import { applyAliases, findAliasLeak, matchIgnore, type CompiledRules } from './rules';
import type { ExistingEntry, SourceKind, StagedTransaction } from './types';

export type BlockedRow = {
  id: string;
  code: 'ALIAS_LEAK' | 'IGNORE_HIT' | 'MISSING_CATEGORY';
  message: string;
};

export type EnforceResult = {
  /** 하나라도 있으면 커밋 전체 중단 */
  blocked: BlockedRow[];
  /** 재대조에서 새로 중복으로 판정된 행 — 커밋에서 빼고 계속 진행 */
  newlyDuplicate: { id: string; duplicateOf: string }[];
  /** 커밋해도 되는 행 (별칭 재치환이 반영된 description) */
  committable: StagedTransaction[];
};

/**
 * 커밋 직전 강제 규칙 (docs/09-settle-mcp.md §5.5).
 * LLM·사용자 입력을 신뢰하지 않고 코드가 다시 검사한다. 규칙 재로드·배치 상태 검사는 호출자가 한다.
 *
 * 1. aliases 재치환 — 실명이 하나라도 남아 있으면 ALIAS_LEAK
 * 2. ignore 재매칭 — stage 이후 규칙이 추가된 경우 IGNORE_HIT
 * 3. category null·목록 밖 → MISSING_CATEGORY
 * 4. 기존 내역 재대조 — stage 이후 앱에서 같은 내역이 들어왔을 수 있다 → duplicate로 빼고 계속
 */
export function enforceBeforeCommit(
  pending: StagedTransaction[],
  sourceKind: SourceKind,
  rules: CompiledRules,
  categoryNames: ReadonlySet<string>,
  existing: ExistingEntry[]
): EnforceResult {
  const blocked: BlockedRow[] = [];
  const newlyDuplicate: EnforceResult['newlyDuplicate'] = [];
  const committable: StagedTransaction[] = [];
  const matcher = createExistingMatcher(existing);

  for (const row of pending) {
    const description = applyAliases(row.rawDescription, rules);
    const leak = findAliasLeak(description, rules);
    if (leak) {
      blocked.push({
        id: row.id,
        code: 'ALIAS_LEAK',
        message: `적요에 실명 "${leak}"이(가) 남아 있습니다. 별칭 규칙을 확인하세요`,
      });
      continue;
    }

    const ignored = matchIgnore(row.rawDescription, row.type, sourceKind, rules);
    if (ignored) {
      blocked.push({
        id: row.id,
        code: 'IGNORE_HIT',
        message: `스테이징 이후 추가된 무시 규칙에 걸립니다: ${ignored.reason}`,
      });
      continue;
    }

    if (!row.category || !categoryNames.has(row.category)) {
      blocked.push({
        id: row.id,
        code: 'MISSING_CATEGORY',
        message: row.category
          ? `카테고리 "${row.category}"는 목록에 없습니다`
          : '카테고리가 없습니다. set_category로 지정하세요',
      });
      continue;
    }

    const dup = matcher.take(row);
    if (dup) {
      newlyDuplicate.push({ id: row.id, duplicateOf: dup });
      continue;
    }

    committable.push({ ...row, description });
  }

  return { blocked, newlyDuplicate, committable };
}
