import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { duplicateScope } from '../core/dedupe';
import { enforceBeforeCommit, type BlockedRow } from '../core/enforce';
import { SettleError } from '../core/errors';
import { buildRetrospective, type Retrospective } from '../core/retrospective';
import type { StagedTransaction } from '../core/types';
import { guarded, loadSessionRules, toolResult, type ToolDeps } from './shared';

const WRITE_CHUNK = 500;

export const commitBatchInputShape = {
  batchId: z.string().min(1),
  dryRun: z.boolean().optional().describe('true면 쓰지 않고 쓸 건수만 돌려준다'),
};

export type CommitBatchInput = { batchId: string; dryRun?: boolean };

export type CommitBatchOutput = {
  batchId: string;
  committed: number;
  wouldCommit: number;
  skipped: { duplicate: number; transfer: number; ignored: number };
  blocked: BlockedRow[];
  entryIds: string[];
  /** 회고 — dryRun에서도 같은 내용. 커밋 전에 "이번 달: 규칙 r / 추정 l / 손 u"를 보여 줄 수 있게 (§11.5) */
  retrospective: Retrospective;
};

/** docs/09-settle-mcp.md §5.5 — 커밋 직전 강제 규칙을 코드가 다시 검사한 뒤 쓴다 */
export async function commitBatch(
  deps: ToolDeps,
  input: CommitBatchInput
): Promise<CommitBatchOutput> {
  const session = await deps.session.require();
  const batch = await deps.store.getBatch(input.batchId);
  if (!batch || batch.coupleId !== session.coupleId) {
    throw new SettleError('BATCH_NOT_FOUND', `배치를 찾을 수 없습니다: ${input.batchId}`);
  }
  if (batch.status !== 'staging') {
    throw new SettleError('BATCH_ALREADY_COMMITTED', `배치가 이미 ${batch.status} 상태입니다`);
  }

  // 1) 규칙 재로드·재검증
  const rules = await loadSessionRules(deps, session);
  const categoryNames = await deps.categories.names(session);

  const pending = await deps.store.listStaged(batch.id, { status: ['pending'] });
  const skipped = {
    duplicate: await deps.store.countStaged(batch.id, ['duplicate']),
    transfer: await deps.store.countStaged(batch.id, ['transfer']),
    ignored: await deps.store.countStaged(batch.id, ['ignored']),
  };
  if (pending.length === 0) {
    throw new SettleError('NOTHING_TO_COMMIT', '커밋할 pending 행이 없습니다', { skipped });
  }

  // 5) 기존 내역 재대조 — stage 이후 앱에서 같은 내역이 들어왔을 수 있다
  const scope = duplicateScope(pending.map((r) => r.date))!;
  let existing;
  try {
    existing = await session.gateway.getExistingEntries(scope.start, scope.end);
  } catch (e) {
    throw new SettleError('FIRESTORE_READ_FAILED', '기존 내역을 읽지 못했습니다', {
      cause: (e as Error).message,
    });
  }

  // 2~4) 별칭 잔존·무시 재매칭·카테고리 검사
  const { blocked, newlyDuplicate, committable } = enforceBeforeCommit(
    pending,
    batch.source.kind,
    rules,
    categoryNames,
    existing
  );

  const retrospective = buildRetrospective({
    rows: await deps.store.listStaged(batch.id),
    committable,
    file: rules.file,
    rulesAtStart: batch.rulesAtStart ?? null,
  });
  const base = {
    batchId: batch.id,
    skipped: { ...skipped, duplicate: skipped.duplicate + newlyDuplicate.length },
    blocked,
    retrospective,
  };

  if (blocked.length > 0) {
    throw new SettleError(
      'COMMIT_BLOCKED',
      `${blocked.length}건이 커밋 조건을 통과하지 못해 한 건도 쓰지 않았습니다`,
      { ...base, committed: 0, wouldCommit: committable.length, entryIds: [] }
    );
  }

  if (!input.dryRun) {
    for (const d of newlyDuplicate) {
      await deps.store.updateStaged(d.id, {
        status: 'duplicate',
        statusReason: `dup:existing#${d.duplicateOf}`,
        duplicateOf: d.duplicateOf,
      });
    }
  }

  if (committable.length === 0) {
    throw new SettleError(
      'NOTHING_TO_COMMIT',
      '재대조 결과 모두 기존 내역과 중복이라 쓸 행이 없습니다',
      {
        ...base,
        committed: 0,
        wouldCommit: 0,
        entryIds: [],
      }
    );
  }

  if (input.dryRun) {
    return { ...base, committed: 0, wouldCommit: committable.length, entryIds: [] };
  }

  // 쓰기 — 500건씩. 중간 실패 시 이미 쓴 것을 지우고 COMMIT_PARTIAL
  const entryIds: string[] = [];
  const written: StagedTransaction[] = [];
  for (let i = 0; i < committable.length; i += WRITE_CHUNK) {
    const chunk = committable.slice(i, i + WRITE_CHUNK);
    try {
      const ids = await session.gateway.addEntries(
        chunk.map((r) => ({
          type: r.type,
          amount: r.amount,
          category: r.category!,
          description: r.description,
          date: r.date,
        }))
      );
      entryIds.push(...ids);
      written.push(...chunk);
    } catch (e) {
      const remaining: string[] = [];
      for (const id of entryIds) {
        try {
          await session.gateway.deleteEntry(id);
        } catch {
          remaining.push(id);
        }
      }
      throw new SettleError(
        remaining.length > 0 ? 'COMMIT_PARTIAL' : 'FIRESTORE_WRITE_FAILED',
        remaining.length > 0
          ? `쓰기 도중 실패했고 ${remaining.length}건은 되돌리지 못했습니다. 앱에서 직접 확인하세요`
          : '가계부에 쓰지 못했습니다. 아무것도 기록되지 않았습니다',
        { cause: (e as Error).message, remainingEntryIds: remaining }
      );
    }
  }

  for (let i = 0; i < written.length; i++) {
    await deps.store.updateStaged(written[i]!.id, {
      status: 'committed',
      description: written[i]!.description,
      committedEntryId: entryIds[i]!,
    });
  }
  await deps.store.updateBatch(batch.id, {
    status: 'committed',
    committedCount: entryIds.length,
    committedEntryIds: entryIds,
    committedAt: new Date().toISOString(),
  });

  return { ...base, committed: entryIds.length, wouldCommit: entryIds.length, entryIds };
}

export function registerCommitBatch(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    'commit_batch',
    {
      title: '배치 커밋',
      description:
        'pending 행을 가계부(Firestore)에 쓴다. 쓰기 직전에 별칭 치환·무시 규칙·카테고리·기존 내역 중복을 코드가 다시 검사하며, 하나라도 막히면 한 건도 쓰지 않는다. 먼저 dryRun:true로 쓸 건수와 회고(retrospective)를 사용자에게 확인받아라. 커밋 후에는 회고 세 줄(규칙/추정/손으로 고친 건수, 새 규칙 수, 규칙 없는 큰 금액)과 promotable("다음 달 전에 규칙으로 올려 둘까요?")을 보여 준다.',
      inputSchema: commitBatchInputShape,
    },
    guarded(async (args) => {
      const out = await commitBatch(deps, args as CommitBatchInput);
      const r = out.retrospective;
      const retro = `회고: 규칙 ${r.byCategorySource.rule}건 / 추정 ${r.byCategorySource.llm}건 / 손으로 ${r.userOverrides}건, 이번 배치에서 새 규칙 ${r.rulesSavedDuringBatch}개${
        r.promotable.length ? `, 규칙으로 올릴 결정 ${r.promotable.length}건` : ''
      }${r.unruledTop.length ? `, 규칙 없는 큰 금액 ${r.unruledTop.length}건` : ''}`;
      return toolResult(
        args.dryRun
          ? `dry run — ${out.wouldCommit}건을 쓰게 됩니다 (중복 ${out.skipped.duplicate}·송금 ${out.skipped.transfer}·무시 ${out.skipped.ignored} 제외). ${retro}. 사용자 확인 후 dryRun 없이 다시 호출하세요`
          : `${out.committed}건을 가계부에 썼습니다. ${retro}. 되돌리려면 undo_batch {batchId:"${out.batchId}"}`,
        out
      );
    })
  );
}
