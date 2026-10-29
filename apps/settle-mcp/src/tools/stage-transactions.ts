import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createExistingMatcher, dedupeWithinBatch, duplicateScope } from '../core/dedupe';
import { SettleError } from '../core/errors';
import { fingerprint } from '../core/fingerprint';
import { newId } from '../core/id';
import { applyRules, recordHits, writeRules, type RulesFile } from '../core/rules';
import { machineRuleCount } from '../core/retrospective';
import { buildSuggestions, type Suggestion } from '../core/suggestions';
import type { Batch, StagedTransaction } from '../core/types';
import { guarded, loadSessionRules, toolResult, type ToolDeps } from './shared';

export const MAX_TRANSACTIONS_PER_CALL = 500;

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다')
  .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), '존재하지 않는 날짜입니다');

export const transactionInputSchema = z.object({
  date: dateSchema,
  amount: z.number().int('원 단위 정수').positive('양수여야 합니다'),
  type: z.enum(['income', 'expense']),
  description: z.string().min(1).max(200).describe('적요 원문 그대로. 요약·치환 금지'),
  category: z
    .string()
    .min(1)
    .max(50)
    .nullable()
    .optional()
    .describe('LLM이 고른 후보. 확신 없으면 null'),
  sourceHint: z.string().max(100).optional().describe("'p.2 7행' 같은 출처 메모"),
});

export const stageInputShape = {
  label: z.string().min(1).max(80).describe("배치 라벨. 예: '2026-09 KB국민 입출금'"),
  source: z.object({
    kind: z.enum(['account', 'card']).describe('계좌 내역서(account) / 카드 내역서(card)'),
    name: z.string().max(80).optional(),
  }),
  transactions: z.array(transactionInputSchema).min(1).max(MAX_TRANSACTIONS_PER_CALL),
};

export type StageInput = {
  label: string;
  source: { kind: 'account' | 'card'; name?: string };
  transactions: z.infer<typeof transactionInputSchema>[];
};

export type StageOutput = {
  batchId: string;
  summary: {
    pending: number;
    duplicate: number;
    transfer: number;
    ignored: number;
    droppedInBatch: number;
    missingCategory: number;
  };
  /** 카테고리 없음 / 송금 / 중복 — 금액 내림차순 (근거 A-3: 큰 것부터 확정한다) */
  needsAttention: StagedTransaction[];
  droppedInBatch: { date: string; amount: number; description: string }[];
  /** 카테고리 규칙이 겹친 행 — 가장 좁은 규칙이 적용됐고 나머지는 여기 (근거 B-5) */
  conflicts: { rowId: string; matchedRuleIds: string[]; appliedRuleId: string }[];
  /** 막지 않는 경고 — 같은 라벨 재커밋 등 (원칙 2) */
  warnings: string[];
  /** 결정 로그·규칙 메타에서 찾아낸 제안. needsAttention 표 아래에 그대로 보여 준다. 서버는 제안까지만 한다 */
  suggestions: Suggestion[];
  /** 기준 요약 — 결산 시작 때 "지난번 기준"을 말할 재료. 리소스를 못 읽는 호스트도 이것으로 흐름이 돈다 */
  playbookDigest: PlaybookDigest;
};

export type PlaybookDigest = {
  principles: number;
  categoryRules: number;
  ignore: number;
  transfer: number;
  aliases: number;
  insiders: number;
  interviewDone: boolean;
  lastCommitAt: string | null;
};

export function playbookDigest(file: RulesFile, lastCommitAt: string | null): PlaybookDigest {
  return {
    principles: file.principles.length,
    categoryRules: file.categoryRules.length,
    ignore: file.ignore.length,
    transfer: file.transfer.length,
    aliases: Object.keys(file.aliases).length,
    insiders: file.insiders.length,
    interviewDone: file.interview.completedAt !== null,
    lastCommitAt,
  };
}

/** docs/09-settle-mcp.md §11.3 적용 순서(규칙) + §5.1 처리 순서(지문·대조·저장)를 따른다 */
export async function stageTransactions(deps: ToolDeps, input: StageInput): Promise<StageOutput> {
  const session = await deps.session.require();
  if (input.transactions.length > MAX_TRANSACTIONS_PER_CALL) {
    throw new SettleError(
      'TOO_MANY_TRANSACTIONS',
      `한 번에 ${MAX_TRANSACTIONS_PER_CALL}건까지 넘길 수 있습니다. 나눠서 호출하세요`
    );
  }
  const rules = await loadSessionRules(deps, session);
  const categoryNames = await deps.categories.names(session);

  const batchId = newId();
  const now = new Date().toISOString();

  // 2) 규칙 적용 + 지문. 적용된 규칙은 hits로, 겹친 규칙은 conflicts로 모은다
  const hits: { ruleId: string; rawDescription: string }[] = [];
  const conflicts: StageOutput['conflicts'] = [];
  const rows: StagedTransaction[] = input.transactions.map((tx) => {
    const applied = applyRules(
      { rawDescription: tx.description, type: tx.type, llmCategory: tx.category ?? null },
      input.source.kind,
      rules,
      categoryNames
    );
    for (const ruleId of applied.hitRuleIds) hits.push({ ruleId, rawDescription: tx.description });
    const id = newId();
    if (applied.conflictRuleIds.length > 0 && applied.appliedRuleId) {
      conflicts.push({
        rowId: id,
        matchedRuleIds: [applied.appliedRuleId, ...applied.conflictRuleIds],
        appliedRuleId: applied.appliedRuleId,
      });
    }
    return {
      id,
      batchId,
      fingerprint: fingerprint(tx.date, tx.amount, tx.description),
      date: tx.date,
      amount: tx.amount,
      type: tx.type,
      rawDescription: tx.description,
      description: applied.description,
      category: applied.category,
      categorySource: applied.categorySource,
      appliedRuleId: applied.appliedRuleId,
      suggestionIds: [],
      status: applied.status,
      statusReason: applied.statusReason,
      duplicateOf: null,
      sourceHint: tx.sourceHint ?? null,
      committedEntryId: null,
      createdAt: now,
    };
  });

  // 2-v) 배치 내 지문 충돌 → 뒤에 온 것을 버린다
  const { kept, dropped } = dedupeWithinBatch(rows);

  // 3) 기존 내역 대조 (ignored 제외)
  const candidates = kept.filter((r) => r.status !== 'ignored');
  const scope = duplicateScope(candidates.map((r) => r.date));
  if (scope) {
    let existing;
    try {
      existing = await session.gateway.getExistingEntries(scope.start, scope.end);
    } catch (e) {
      throw new SettleError('FIRESTORE_READ_FAILED', '기존 내역을 읽지 못했습니다', {
        cause: (e as Error).message,
      });
    }
    const matcher = createExistingMatcher(existing);
    for (const row of candidates) {
      const dup = matcher.take(row);
      if (dup) {
        row.status = 'duplicate';
        row.statusReason = `dup:existing#${dup}`;
        row.duplicateOf = dup;
      }
    }
  }

  // 4) 제안 — 결정 로그·규칙 메타에서. 행에 제안 id를 붙여 저장한다
  const { suggestions, byRow } = buildSuggestions(kept, rules.file);
  for (const row of kept) row.suggestionIds = byRow.get(row.id) ?? [];

  // 4-ii) 같은 라벨을 이미 커밋했으면 경고 — 같은 내역서를 두 번 넣는 가장 흔한 사고 (원칙 2)
  const warnings: string[] = [];
  const batches = await deps.store.listBatches(session.coupleId);
  const sameLabel = batches.filter((b) => b.status === 'committed' && b.label === input.label);
  for (const b of sameLabel) {
    warnings.push(
      `같은 라벨 "${input.label}"의 배치 ${b.id}를 ${b.committedAt}에 이미 커밋했습니다(${b.committedCount}건). 같은 내역서를 두 번 넣은 것이 아닌지 확인하세요 — 원칙 2(같은 돈은 한 번만 적는다)`
    );
  }
  const lastCommitAt =
    batches
      .filter((b) => b.status === 'committed' && b.committedAt)
      .map((b) => b.committedAt!)
      .sort()
      .at(-1) ?? null;

  // 5) 저장
  const batch: Batch = {
    id: batchId,
    coupleId: session.coupleId,
    label: input.label,
    source: { kind: input.source.kind, name: input.source.name ?? null },
    stagedCount: kept.length,
    committedCount: 0,
    committedEntryIds: [],
    rulesAtStart: machineRuleCount(rules.file),
    status: 'staging',
    createdAt: now,
    committedAt: null,
    undoneAt: null,
  };
  await deps.store.createBatch(batch);
  await deps.store.insertStaged(kept);

  // 6) 규칙 적용 횟수·예시 기록 (근거 E-3). 배치 저장 뒤에 하므로 실패해도 스테이징은 남는다
  const nextRules = hits.length > 0 ? recordHits(rules.file, hits, now) : rules.file;
  if (hits.length > 0) await writeRules(deps.rulesPath, nextRules);

  const count = (s: StagedTransaction['status']) => kept.filter((r) => r.status === s).length;
  const needsAttention = kept
    .filter(
      (r) =>
        r.status === 'transfer' ||
        r.status === 'duplicate' ||
        (r.status === 'pending' && r.category === null)
    )
    .sort(
      (a, b) => b.amount - a.amount || a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
    );

  return {
    batchId,
    summary: {
      pending: count('pending'),
      duplicate: count('duplicate'),
      transfer: count('transfer'),
      ignored: count('ignored'),
      droppedInBatch: dropped.length,
      missingCategory: kept.filter((r) => r.status !== 'ignored' && r.category === null).length,
    },
    needsAttention,
    droppedInBatch: dropped.map((r) => ({
      date: r.date,
      amount: r.amount,
      description: r.rawDescription,
    })),
    conflicts,
    warnings,
    suggestions,
    playbookDigest: playbookDigest(nextRules, lastCommitAt),
  };
}

export function registerStageTransactions(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    'stage_transactions',
    {
      title: '내역서 거래 스테이징',
      description:
        '내역서에서 읽은 거래 행들을 스테이징한다. 규칙(무시·송금·별칭·카테고리) 적용, 배치 내 중복 제거, 가계부 기존 내역과의 중복 대조를 한 번에 하고 배치 ID를 돌려준다. 응답의 needsAttention(금액 큰 순)·suggestions(지난 결정·규칙 승격 후보·규칙 없는 큰 금액)·conflicts·warnings를 사용자에게 보여 주고 결정을 받는다. 아직 가계부에 쓰지 않는다 — commit_batch로 확정한다.',
      inputSchema: stageInputShape,
    },
    guarded(async (args) => {
      const out = await stageTransactions(deps, args as StageInput);
      const s = out.summary;
      const extras = [
        out.warnings.length ? `경고 ${out.warnings.length}건을 먼저 보여 준다` : null,
        out.suggestions.length
          ? `제안 ${out.suggestions.length}건(promote·pastDecision·inconsistent·bigUnruled)을 표 아래에 보여 준다`
          : null,
        out.conflicts.length ? `규칙이 겹친 행 ${out.conflicts.length}건` : null,
      ].filter(Boolean);
      return toolResult(
        `배치 ${out.batchId} 스테이징 완료 — 커밋 대상 ${s.pending}건, 중복 ${s.duplicate}건, 송금 확인 ${s.transfer}건, 무시 ${s.ignored}건, 배치 내 중복 제거 ${s.droppedInBatch}건, 카테고리 없음 ${s.missingCategory}건.${extras.length ? ` ${extras.join(', ')}.` : ''} needsAttention(금액 큰 순)을 표로 보여주고 사용자 결정을 받은 뒤 set_category → commit_batch {dryRun:true} 순으로 진행한다. 제안은 자동 적용하지 않는다.`,
        out
      );
    })
  );
}
