import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PROMOTE_THRESHOLD, recordDecision, type PromotableDecision } from '../core/decisions';
import { SettleError } from '../core/errors';
import { writeRules, type RulesFile } from '../core/rules';
import type { StagedTransaction } from '../core/types';
import { guarded, loadSessionRules, toolResult, type ToolDeps } from './shared';

export const setCategoryInputShape = {
  batchId: z.string().min(1),
  changes: z
    .array(
      z.object({
        id: z.string().min(1).describe('StagedTransaction.id'),
        category: z.string().min(1).max(50).optional().describe('카테고리 목록에 있는 name'),
        status: z
          .enum(['pending', 'transfer', 'duplicate'])
          .optional()
          .describe('상태 전환. ignored·committed로는 바꿀 수 없다'),
      })
    )
    .min(1)
    .max(500),
};

export type SetCategoryInput = {
  batchId: string;
  changes: { id: string; category?: string; status?: 'pending' | 'transfer' | 'duplicate' }[];
};

export type SetCategoryOutput = {
  updated: number;
  rejected: { id: string; code: string; message: string }[];
  warnings: string[];
  /** 이번 호출로 같은 결정이 PROMOTE_THRESHOLD회 이상 쌓인 적요 — "앞으로도 이렇게 할까요?" (원칙 5) */
  promotable: PromotableDecision[];
};

export async function setCategory(
  deps: ToolDeps,
  input: SetCategoryInput
): Promise<SetCategoryOutput> {
  const session = await deps.session.require();
  const batch = await deps.store.getBatch(input.batchId);
  if (!batch || batch.coupleId !== session.coupleId) {
    throw new SettleError('BATCH_NOT_FOUND', `배치를 찾을 수 없습니다: ${input.batchId}`);
  }
  if (batch.status !== 'staging') {
    throw new SettleError(
      'BATCH_ALREADY_COMMITTED',
      '이미 커밋(또는 되돌리기)된 배치는 수정할 수 없습니다'
    );
  }
  const categoryNames = await deps.categories.names(session);

  let updated = 0;
  const rejected: SetCategoryOutput['rejected'] = [];
  const warnings: string[] = [];
  /** 카테고리를 바꾼 결정만 로그에 남긴다 — 상태 전환은 그 배치의 사정이다 */
  const decided: { rawDescription: string; category: string }[] = [];

  for (const change of input.changes) {
    const row = await deps.store.getStaged(change.id);
    if (!row || row.batchId !== batch.id) {
      rejected.push({ id: change.id, code: 'NOT_FOUND', message: '이 배치에 없는 행입니다' });
      continue;
    }
    if (row.status === 'ignored') {
      rejected.push({
        id: change.id,
        code: 'IGNORED_LOCKED',
        message:
          '무시 규칙에 걸린 행은 바꿀 수 없습니다. save_rule로 패턴을 지우고 다시 stage_transactions 하세요',
      });
      continue;
    }
    if (row.status === 'committed') {
      rejected.push({
        id: change.id,
        code: 'BATCH_ALREADY_COMMITTED',
        message: '이미 커밋된 행입니다',
      });
      continue;
    }
    if (change.category !== undefined && !categoryNames.has(change.category)) {
      rejected.push({
        id: change.id,
        code: 'UNKNOWN_CATEGORY',
        message: `카테고리 "${change.category}"는 목록에 없습니다. uandi://categories 를 확인하세요`,
      });
      continue;
    }
    if (change.category === undefined && change.status === undefined) {
      rejected.push({
        id: change.id,
        code: 'INVALID_INPUT',
        message: 'category나 status 중 하나는 있어야 합니다',
      });
      continue;
    }

    const patch: Partial<StagedTransaction> = {};
    if (change.category !== undefined) {
      patch.category = change.category;
      patch.categorySource = 'user';
      patch.appliedRuleId = null;
      decided.push({ rawDescription: row.rawDescription, category: change.category });
    }
    if (change.status !== undefined && change.status !== row.status) {
      if (row.status === 'duplicate' && change.status === 'pending') {
        warnings.push(
          `${row.id}: 기존 내역 ${row.duplicateOf}와 같은 날(${row.date}) 같은 금액(${row.amount})입니다. 커밋하면 두 건이 됩니다`
        );
      }
      patch.status = change.status;
      // 'user:' 접두사 — save_rule 재적용이 사용자가 정한 상태를 덮어쓰지 않게 하는 표식
      patch.statusReason = `user:${change.status}`;
      if (change.status !== 'duplicate') patch.duplicateOf = row.duplicateOf;
    }
    await deps.store.updateStaged(row.id, patch);
    updated += 1;
  }

  const promotable = await recordDecisions(deps, session, batch.id, decided);
  return { updated, rejected, warnings, promotable };
}

async function recordDecisions(
  deps: ToolDeps,
  session: Awaited<ReturnType<ToolDeps['session']['require']>>,
  batchId: string,
  decided: { rawDescription: string; category: string }[]
): Promise<PromotableDecision[]> {
  if (decided.length === 0) return [];
  let file: RulesFile = (await loadSessionRules(deps, session)).file;
  const now = new Date().toISOString();
  const reached = new Map<string, PromotableDecision>();
  for (const d of decided) {
    const res = recordDecision(file, { ...d, batchId }, now);
    file = res.file;
    const { key, sample, category, count } = res.decision;
    const hasExactRule = file.categoryRules.some(
      (r) => r.match.kind === 'exact' && r.match.key === key
    );
    if (count >= PROMOTE_THRESHOLD && !hasExactRule) {
      reached.set(`${key}|${category}`, { key, sample, category, count });
    }
  }
  await writeRules(deps.rulesPath, file);
  return [...reached.values()];
}

export function registerSetCategory(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    'set_category',
    {
      title: '카테고리·상태 변경',
      description:
        '스테이징 행의 카테고리를 지정하거나 상태(pending/transfer/duplicate)를 바꾼다. 여러 행을 한 번에. 무시(ignored) 행은 바꿀 수 없다.',
      inputSchema: setCategoryInputShape,
    },
    guarded(async (args) => {
      const out = await setCategory(deps, args as SetCategoryInput);
      return toolResult(
        `${out.updated}건 변경, ${out.rejected.length}건 거절${out.warnings.length ? `, 경고 ${out.warnings.length}건` : ''}${
          out.promotable.length
            ? `. 같은 결정이 ${PROMOTE_THRESHOLD}번 이상 쌓인 적요 ${out.promotable.length}건 — "앞으로도 이렇게 할까요?"라고 묻고, 그래라고 하면 save_rule {kind:"promote"}`
            : ''
        }`,
        out
      );
    })
  );
}
