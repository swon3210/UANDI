import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SettleError } from '../core/errors';
import { normalize } from '../core/fingerprint';
import {
  applyRules,
  compilePattern,
  compileRules,
  writeRules,
  type CompiledRules,
  type RulesFile,
} from '../core/rules';
import type { Batch, StagedTransaction } from '../core/types';
import { guarded, loadSessionRules, toolResult, type ToolDeps } from './shared';

export const saveRuleInputShape = {
  rule: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('exactCategory'),
      description: z.string().min(1).max(200).describe('적요. normalize되어 저장된다'),
      category: z.string().min(1).max(50),
    }),
    z.object({
      kind: z.literal('alias'),
      realName: z.string().min(1).max(50),
      alias: z.string().min(1).max(50),
    }),
    z.object({
      kind: z.literal('ignore'),
      pattern: z.string().min(1).max(200).describe('정규식 (u 플래그)'),
      reason: z.string().min(1).max(200),
      onlyFor: z
        .object({
          sourceKind: z.enum(['account', 'card']).optional(),
          type: z.enum(['income', 'expense']).optional(),
        })
        .optional(),
    }),
    z.object({
      kind: z.literal('transfer'),
      pattern: z.string().min(1).max(200),
      requireKnownName: z.boolean().optional(),
    }),
    z.object({
      kind: z.literal('remove'),
      target: z.enum(['exactCategory', 'alias', 'ignore', 'transfer']),
      key: z.string().min(1).max(200).describe('description / realName / pattern'),
    }),
  ]),
};

export type SaveRuleInput = { rule: z.infer<(typeof saveRuleInputShape)['rule']> };

export type SaveRuleOutput = {
  rules: RulesFile;
  appliedToBatch?: { batchId: string; changed: number };
};

function nextRules(
  current: RulesFile,
  rule: SaveRuleInput['rule'],
  categoryNames: Set<string>
): RulesFile {
  const next: RulesFile = structuredClone(current);
  switch (rule.kind) {
    case 'exactCategory': {
      if (!categoryNames.has(rule.category)) {
        throw new SettleError('UNKNOWN_CATEGORY', `카테고리 "${rule.category}"는 목록에 없습니다`);
      }
      const key = normalize(rule.description);
      if (!key) throw new SettleError('INVALID_INPUT', '적요가 비어 있습니다');
      next.exactCategory[key] = rule.category;
      return next;
    }
    case 'alias':
      next.aliases[rule.realName] = rule.alias;
      return next;
    case 'ignore':
      compilePattern(rule.pattern);
      next.ignore = next.ignore.filter((r) => r.pattern !== rule.pattern);
      next.ignore.push({
        pattern: rule.pattern,
        reason: rule.reason,
        ...(rule.onlyFor ? { onlyFor: rule.onlyFor } : {}),
      });
      return next;
    case 'transfer':
      compilePattern(rule.pattern);
      next.transfer = next.transfer.filter((r) => r.pattern !== rule.pattern);
      next.transfer.push({
        pattern: rule.pattern,
        ...(rule.requireKnownName !== undefined ? { requireKnownName: rule.requireKnownName } : {}),
      });
      return next;
    case 'remove': {
      switch (rule.target) {
        case 'exactCategory':
          delete next.exactCategory[normalize(rule.key)];
          break;
        case 'alias':
          delete next.aliases[rule.key];
          break;
        case 'ignore':
          next.ignore = next.ignore.filter((r) => r.pattern !== rule.key);
          break;
        case 'transfer':
          next.transfer = next.transfer.filter((r) => r.pattern !== rule.key);
          break;
      }
      return next;
    }
  }
}

/**
 * 커밋 전 배치에 새 규칙을 다시 적용한다. 사용자가 set_category로 바꾼 행(categorySource='user')의
 * 카테고리는 건드리지 않는다. 상태는 사용자가 바꾼 것(statusReason 'user:*')도 보존한다.
 */
async function reapplyToBatch(
  deps: ToolDeps,
  batch: Batch,
  rules: CompiledRules,
  categoryNames: Set<string>
): Promise<number> {
  const rows = await deps.store.listStaged(batch.id);
  let changed = 0;
  for (const row of rows) {
    if (row.status === 'committed') continue;
    const applied = applyRules(
      {
        rawDescription: row.rawDescription,
        type: row.type,
        llmCategory: row.categorySource === 'llm' ? row.category : null,
      },
      batch.source.kind,
      rules,
      categoryNames
    );
    const patch: Partial<StagedTransaction> = {};
    if (applied.description !== row.description) patch.description = applied.description;
    if (row.categorySource !== 'user' && applied.category !== row.category) {
      patch.category = applied.category;
      patch.categorySource = applied.categorySource;
    }
    const userSetStatus = row.statusReason?.startsWith('user:') ?? false;
    const keepDuplicate = row.status === 'duplicate' && applied.status === 'pending';
    if (!userSetStatus && !keepDuplicate && applied.status !== row.status) {
      patch.status = applied.status;
      patch.statusReason = applied.statusReason;
    }
    if (Object.keys(patch).length === 0) continue;
    await deps.store.updateStaged(row.id, patch);
    changed += 1;
  }
  return changed;
}

export async function saveRule(deps: ToolDeps, input: SaveRuleInput): Promise<SaveRuleOutput> {
  const session = await deps.session.require();
  const current = await loadSessionRules(deps, session);
  const categoryNames = await deps.categories.names(session);

  const next = nextRules(current.file, input.rule, categoryNames);
  const compiled = compileRules(next);
  await writeRules(deps.rulesPath, next);

  const batch = await deps.store.latestStagingBatch(session.coupleId);
  if (!batch) return { rules: next };
  const changed = await reapplyToBatch(deps, batch, compiled, categoryNames);
  return { rules: next, appliedToBatch: { batchId: batch.id, changed } };
}

export function registerSaveRule(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    'save_rule',
    {
      title: '규칙 저장',
      description:
        '로컬 규칙 파일에 항목을 추가·삭제한다 — 적요 정확일치→카테고리, 실명→별칭, 무시 패턴, 송금 패턴. "앞으로 스타벅스는 식비로", "홍길동은 처형이라고 써" 같은 요청에 쓴다. 규칙은 사용자 PC에만 저장되고 서비스 서버로 가지 않는다. 커밋 전 배치가 있으면 새 규칙을 다시 적용한다.',
      inputSchema: saveRuleInputShape,
    },
    guarded(async (args) => {
      const out = await saveRule(deps, args as SaveRuleInput);
      return toolResult(
        out.appliedToBatch
          ? `규칙 저장 완료. 배치 ${out.appliedToBatch.batchId}의 ${out.appliedToBatch.changed}건에 다시 적용했습니다`
          : '규칙 저장 완료',
        out
      );
    })
  );
}
