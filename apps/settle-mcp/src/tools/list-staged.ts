import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SettleError } from '../core/errors';
import type { Batch, StagedStatus, StagedTransaction } from '../core/types';
import { guarded, toolResult, type ToolDeps } from './shared';

const statusSchema = z.enum(['pending', 'duplicate', 'ignored', 'transfer', 'committed']);

export const listStagedInputShape = {
  batchId: z.string().min(1),
  status: z.array(statusSchema).optional().describe('비우면 전체'),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(500).optional().describe('기본 200'),
};

export type ListStagedInput = {
  batchId: string;
  status?: StagedStatus[];
  offset?: number;
  limit?: number;
};

export type ListStagedOutput = {
  batch: Batch;
  items: StagedTransaction[];
  nextOffset: number | null;
};

export async function listStaged(
  deps: ToolDeps,
  input: ListStagedInput
): Promise<ListStagedOutput> {
  const session = await deps.session.require();
  const batch = await deps.store.getBatch(input.batchId);
  if (!batch || batch.coupleId !== session.coupleId) {
    throw new SettleError('BATCH_NOT_FOUND', `배치를 찾을 수 없습니다: ${input.batchId}`);
  }
  const offset = input.offset ?? 0;
  const limit = input.limit ?? 200;
  const total = await deps.store.countStaged(batch.id, input.status);
  const items = await deps.store.listStaged(batch.id, { status: input.status, offset, limit });
  const next = offset + items.length;
  return { batch, items, nextOffset: next < total ? next : null };
}

export function registerListStaged(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    'list_staged',
    {
      title: '스테이징 행 조회',
      description: '배치의 스테이징 행을 상태별로 조회한다. 200건씩 페이지네이션.',
      inputSchema: listStagedInputShape,
    },
    guarded(async (args) => {
      const out = await listStaged(deps, args as ListStagedInput);
      return toolResult(
        `배치 "${out.batch.label}" (${out.batch.status}) — ${out.items.length}건${out.nextOffset !== null ? `, 다음 offset ${out.nextOffset}` : ''}`,
        out
      );
    })
  );
}
