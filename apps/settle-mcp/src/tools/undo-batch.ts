import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SettleError } from '../core/errors';
import { guarded, toolResult, type ToolDeps } from './shared';

export const UNDO_WINDOW_DAYS = 30;

export const undoBatchInputShape = { batchId: z.string().min(1) };

export type UndoBatchInput = { batchId: string };

export type UndoBatchOutput = {
  batchId: string;
  deleted: number;
  /** 이미 앱에서 지운 것 */
  notFound: string[];
  /** createdBy가 로그인 uid와 달라 건너뛴 것 */
  skippedForeign: string[];
};

export async function undoBatch(
  deps: ToolDeps,
  input: UndoBatchInput,
  now: () => number = Date.now
): Promise<UndoBatchOutput> {
  const session = await deps.session.require();
  const batch = await deps.store.getBatch(input.batchId);
  if (!batch || batch.coupleId !== session.coupleId) {
    throw new SettleError('BATCH_NOT_FOUND', `배치를 찾을 수 없습니다: ${input.batchId}`);
  }
  if (batch.status !== 'committed' || !batch.committedAt) {
    throw new SettleError(
      'BATCH_NOT_COMMITTED',
      `커밋된 배치만 되돌릴 수 있습니다 (현재 ${batch.status})`
    );
  }
  const ageMs = now() - Date.parse(batch.committedAt);
  if (ageMs > UNDO_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
    throw new SettleError(
      'UNDO_EXPIRED',
      `커밋 후 ${UNDO_WINDOW_DAYS}일이 지난 배치는 되돌릴 수 없습니다. 앱에서 직접 지우세요`
    );
  }

  const notFound: string[] = [];
  const skippedForeign: string[] = [];
  let deleted = 0;

  // Batch.committedEntryIds에 있는 문서만. 그 외 문서는 절대 건드리지 않는다
  for (const entryId of batch.committedEntryIds) {
    let creator: string | null;
    try {
      creator = await session.gateway.getEntryCreator(entryId);
    } catch (e) {
      throw new SettleError('FIRESTORE_READ_FAILED', `내역 ${entryId}를 읽지 못했습니다`, {
        cause: (e as Error).message,
        deletedSoFar: deleted,
      });
    }
    if (creator === null) {
      notFound.push(entryId);
      continue;
    }
    if (creator !== session.uid) {
      skippedForeign.push(entryId);
      continue;
    }
    try {
      await session.gateway.deleteEntry(entryId);
    } catch (e) {
      throw new SettleError('FIRESTORE_WRITE_FAILED', `내역 ${entryId}를 지우지 못했습니다`, {
        cause: (e as Error).message,
        deletedSoFar: deleted,
      });
    }
    deleted += 1;
  }

  const rows = await deps.store.listStaged(batch.id, { status: ['committed'] });
  for (const row of rows) {
    await deps.store.updateStaged(row.id, {
      status: 'pending',
      statusReason: null,
      committedEntryId: null,
    });
  }
  await deps.store.updateBatch(batch.id, {
    status: 'undone',
    undoneAt: new Date(now()).toISOString(),
  });

  return { batchId: batch.id, deleted, notFound, skippedForeign };
}

export function registerUndoBatch(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    'undo_batch',
    {
      title: '배치 되돌리기',
      description:
        '커밋한 배치가 가계부에 쓴 내역을 지운다. 그 배치가 만든 문서만 지우며 커밋 후 30일까지만 가능하다. 행은 다시 pending이 되어 재커밋할 수 있다.',
      inputSchema: undoBatchInputShape,
    },
    guarded(async (args) => {
      const out = await undoBatch(deps, args as UndoBatchInput);
      return toolResult(
        `${out.deleted}건 삭제${out.notFound.length ? `, ${out.notFound.length}건은 이미 없음` : ''}${out.skippedForeign.length ? `, ${out.skippedForeign.length}건은 다른 사용자 소유라 건너뜀` : ''}`,
        out
      );
    })
  );
}
