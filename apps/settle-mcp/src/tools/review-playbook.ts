import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createMasker, identityMasker } from '../core/mask';
import {
  REVIEW_FOCUSES,
  reviewPlaybook,
  type PlaybookReview,
  type ReviewFocus,
} from '../core/review';
import { guarded, loadSessionRules, toolResult, type ToolDeps } from './shared';
import { playbookDigest, type PlaybookDigest } from './stage-transactions';

export const reviewPlaybookInputShape = {
  focus: z
    .array(z.enum(REVIEW_FOCUSES))
    .optional()
    .describe('비우면 전부. 주면 그 항목만 계산하고 나머지는 빈 배열'),
};

export type ReviewPlaybookInput = { focus?: ReviewFocus[] };

export type ReviewPlaybookOutput = { digest: PlaybookDigest } & PlaybookReview;

/** docs/09-settle-mcp.md §11.5 review_playbook — 내역서 없이 기준을 점검한다. 읽기 전용 */
export async function reviewPlaybookTool(
  deps: ToolDeps,
  input: ReviewPlaybookInput
): Promise<ReviewPlaybookOutput> {
  const session = await deps.session.require();
  const compiled = await loadSessionRules(deps, session);
  const masker = deps.exposeAliasesInResource ? identityMasker : createMasker(compiled.file);
  const batches = await deps.store.listBatches(session.coupleId);
  const lastCommitAt =
    batches
      .filter((b) => b.status === 'committed' && b.committedAt)
      .map((b) => b.committedAt!)
      .sort()
      .at(-1) ?? null;
  const review = reviewPlaybook(compiled, { focus: input.focus, masker });
  return { digest: playbookDigest(compiled.file, lastCommitAt), ...review };
}

export function registerReviewPlaybook(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    'review_playbook',
    {
      title: '기준 점검 (읽기 전용)',
      description:
        '내역서 없이 사용자가 세운 기준을 점검한다. 말로만 있는 기준(principles 중 ruleIds가 빈 것), 규칙으로 올릴 결정(promotable), 같은 적요 다른 카테고리(inconsistent), 겹치는 규칙(conflicts), 이유 없는 규칙(noRationale), 60일 넘게 안 쓰인 규칙(unused), 원칙과 어긋난 규칙(principleConflicts)을 돌려준다. 아무것도 바꾸지 않는다 — 바꾸는 것은 사용자 결정 뒤 save_rule로.',
      inputSchema: reviewPlaybookInputShape,
    },
    guarded(async (args) => {
      const out = await reviewPlaybookTool(deps, args as ReviewPlaybookInput);
      const parts = [
        `기준 ${out.digest.principles}개(말로만 ${out.principles.filter((p) => p.ruleIds.length === 0).length}), 규칙 ${
          out.digest.categoryRules + out.digest.ignore + out.digest.transfer
        }개`,
        out.promotable.length ? `규칙으로 올릴 결정 ${out.promotable.length}` : null,
        out.inconsistent.length ? `일관되지 않은 적요 ${out.inconsistent.length}` : null,
        out.conflicts.length ? `겹치는 규칙 ${out.conflicts.length}` : null,
        out.noRationale.length ? `이유 없는 규칙 ${out.noRationale.length}` : null,
        out.unused.length ? `안 쓰는 규칙 ${out.unused.length}` : null,
        out.principleConflicts.length
          ? `원칙과 어긋난 규칙 ${out.principleConflicts.length}`
          : null,
      ].filter(Boolean);
      return toolResult(
        `${parts.join(', ')}. 비어 있지 않은 것만 한 번에 하나씩 묻고, 사용자가 결정하지 않은 것은 바꾸지 않는다.`,
        out
      );
    })
  );
}
