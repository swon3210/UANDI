import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { conflictsOfCategoryRule, conflictsOfRemoval, conflictWarning } from '../core/conflicts';
import { SettleError } from '../core/errors';
import { normalize } from '../core/fingerprint';
import { newId } from '../core/id';
import { applyInterviewAnswers, interviewAnswersSchema, resetInterview } from '../core/interview';
import {
  applyRules,
  compilePattern,
  compileRules,
  findRuleById,
  newRuleMeta,
  normalizedKeyOf,
  writeRules,
  type CategoryRule,
  type CompiledRules,
  type RulesFile,
  type UserPrinciple,
} from '../core/rules';
import type { Batch, StagedTransaction } from '../core/types';
import { guarded, loadSessionRules, toolResult, type ToolDeps } from './shared';

const rationaleSchema = z
  .string()
  .min(1)
  .max(200)
  .optional()
  .describe('왜 이렇게 정했는지 한 줄 (원칙 5). 사용자가 말한 이유를 그대로');
const scopeSchema = z
  .object({
    sourceKind: z.enum(['account', 'card']).optional(),
    type: z.enum(['income', 'expense']).optional(),
  })
  .optional();
const linkSchema = z
  .string()
  .min(1)
  .optional()
  .describe('이 규칙이 구현하는 기준(principle)의 id. 기준의 ruleIds에 연결된다');

export const saveRuleInputShape = {
  rule: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('exactCategory'),
      description: z.string().min(1).max(200).describe('적요. normalize되어 저장된다'),
      category: z.string().min(1).max(50),
      rationale: rationaleSchema,
      linkToPrincipleId: linkSchema,
    }),
    z.object({
      kind: z.literal('categoryRule'),
      match: z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('exact'), key: z.string().min(1).max(200) }),
        z.object({ kind: z.literal('contains'), text: z.string().min(1).max(200) }),
        z.object({ kind: z.literal('regex'), pattern: z.string().min(1).max(200) }),
      ]),
      category: z.string().min(1).max(50),
      onlyFor: scopeSchema,
      evenIfTransfer: z
        .boolean()
        .optional()
        .describe('송금 패턴·우리 이름에 맞아도 이 카테고리의 거래로 기록 (부모님 용돈 등)'),
      rationale: rationaleSchema,
      linkToPrincipleId: linkSchema,
    }),
    z.object({
      kind: z.literal('promote'),
      key: z.string().min(1).max(200).describe('set_category 응답 promotable의 key'),
      category: z.string().min(1).max(50),
      rationale: rationaleSchema,
      linkToPrincipleId: linkSchema,
    }),
    z.object({
      kind: z.literal('principle'),
      text: z
        .string()
        .min(1)
        .max(200)
        .describe('사용자가 말한 기준을 사람 말로. 예: "배달은 식비로 본다"'),
      topic: z.enum(['category', 'duplicate', 'transfer', 'cash', 'refund', 'other']),
    }),
    z.object({
      kind: z.literal('interview'),
      answers: interviewAnswersSchema
        .optional()
        .describe('uandi://interview 각 질문의 answerShape대로'),
      reset: z.boolean().optional().describe('true면 completedAt만 비운다 (기준·규칙은 유지)'),
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
      onlyFor: scopeSchema,
      rationale: rationaleSchema,
      linkToPrincipleId: linkSchema,
    }),
    z.object({
      kind: z.literal('transfer'),
      pattern: z.string().min(1).max(200),
      requireKnownName: z.boolean().optional(),
      rationale: rationaleSchema,
      linkToPrincipleId: linkSchema,
    }),
    z.object({
      kind: z.literal('remove'),
      id: z.string().min(1).optional().describe('규칙·기준 id (v2). 이것 또는 target+key'),
      target: z.enum(['exactCategory', 'alias', 'ignore', 'transfer']).optional(),
      key: z
        .string()
        .min(1)
        .max(200)
        .optional()
        .describe('description / realName / pattern (v1 호환)'),
    }),
  ]),
};

export type SaveRuleInput = { rule: z.infer<(typeof saveRuleInputShape)['rule']> };

export type SaveRuleOutput = {
  rules: RulesFile;
  appliedToBatch?: { batchId: string; changed: number };
  /** 새로 만든 규칙·기준의 id (linkToPrincipleId·remove에 쓴다) */
  savedId?: string;
  /** 원칙과 어긋남, 건너뛴 인터뷰 질문 등. 막은 것은 없다 */
  warnings: string[];
};

type Mutation = { next: RulesFile; savedId?: string; warnings: string[] };

function linkToPrinciple(next: RulesFile, principleId: string | undefined, ruleId: string): void {
  if (!principleId) return;
  const principle = next.principles.find((p) => p.id === principleId);
  if (!principle)
    throw new SettleError('INVALID_INPUT', `기준 ${principleId}을(를) 찾을 수 없습니다`);
  if (!principle.ruleIds.includes(ruleId)) principle.ruleIds.push(ruleId);
}

function assertCategory(category: string, categoryNames: Set<string>): void {
  if (!categoryNames.has(category)) {
    throw new SettleError('UNKNOWN_CATEGORY', `카테고리 "${category}"는 목록에 없습니다`);
  }
}

/** 카테고리 규칙을 넣는다. 같은 match가 이미 있으면 메타(id·hits)를 보존하며 덮어쓴다 */
function upsertCategoryRule(
  next: RulesFile,
  rule: Omit<CategoryRule, keyof ReturnType<typeof newRuleMeta>>,
  meta: { source: CategoryRule['source']; rationale?: string },
  now: string
): { rule: CategoryRule; warning: string | null } {
  const sameMatch = (r: CategoryRule) => JSON.stringify(r.match) === JSON.stringify(rule.match);
  const existing = next.categoryRules.find(sameMatch);
  const full: CategoryRule = {
    ...(existing ?? newRuleMeta({ source: meta.source }, now)),
    ...rule,
  };
  if (meta.rationale) full.rationale = meta.rationale;
  if (existing && meta.source === 'promoted') full.source = 'promoted';
  full.conflictsWith = conflictsOfCategoryRule(full, next);
  next.categoryRules = next.categoryRules.filter((r) => !sameMatch(r));
  next.categoryRules.push(full);
  return { rule: full, warning: conflictWarning(full.conflictsWith, '저장했습니다') };
}

/**
 * 규칙 파일 v2에 한 항목을 넣거나 뺀다 (docs/09-settle-mcp.md §11.5 save_rule).
 * 원칙과 어긋나는 저장은 conflictsWith에 기록하고 경고하되 막지 않는다 (원칙 6).
 */
function mutate(
  current: RulesFile,
  rule: SaveRuleInput['rule'],
  categoryNames: Set<string>,
  now: string
): Mutation {
  const next: RulesFile = structuredClone(current);
  const warnings: string[] = [];

  switch (rule.kind) {
    case 'exactCategory': {
      assertCategory(rule.category, categoryNames);
      const { rule: saved, warning } = upsertCategoryRule(
        next,
        {
          match: { kind: 'exact', key: normalizedKeyOf(rule.description) },
          category: rule.category,
        },
        { source: 'user', rationale: rule.rationale },
        now
      );
      if (warning) warnings.push(warning);
      linkToPrinciple(next, rule.linkToPrincipleId, saved.id);
      return { next, savedId: saved.id, warnings };
    }
    case 'categoryRule': {
      assertCategory(rule.category, categoryNames);
      const match: CategoryRule['match'] =
        rule.match.kind === 'exact'
          ? { kind: 'exact', key: normalizedKeyOf(rule.match.key) }
          : rule.match.kind === 'contains'
            ? { kind: 'contains', text: rule.match.text }
            : { kind: 'regex', pattern: rule.match.pattern };
      if (match.kind === 'contains') normalizedKeyOf(match.text);
      if (match.kind === 'regex') compilePattern(match.pattern);
      const { rule: saved, warning } = upsertCategoryRule(
        next,
        {
          match,
          category: rule.category,
          ...(rule.onlyFor ? { onlyFor: rule.onlyFor } : {}),
          ...(rule.evenIfTransfer !== undefined ? { evenIfTransfer: rule.evenIfTransfer } : {}),
        },
        { source: 'user', rationale: rule.rationale },
        now
      );
      if (warning) warnings.push(warning);
      linkToPrinciple(next, rule.linkToPrincipleId, saved.id);
      return { next, savedId: saved.id, warnings };
    }
    case 'promote': {
      assertCategory(rule.category, categoryNames);
      const key = normalizedKeyOf(rule.key);
      const decision = next.decisions.find((d) => d.key === key && d.category === rule.category);
      if (!decision) {
        throw new SettleError(
          'INVALID_INPUT',
          `결정 로그에 "${rule.key}" → ${rule.category}가 없습니다. set_category 응답의 promotable에서 key를 쓰세요`
        );
      }
      const { rule: saved, warning } = upsertCategoryRule(
        next,
        { match: { kind: 'exact', key }, category: rule.category },
        {
          source: 'promoted',
          rationale:
            rule.rationale ??
            `손으로 ${decision.count}번 같은 카테고리로 고름 (${decision.sample})`,
        },
        now
      );
      saved.examples = saved.examples.includes(decision.sample)
        ? saved.examples
        : [decision.sample, ...saved.examples].slice(0, 3);
      if (warning) warnings.push(warning);
      // 승격된 key의 결정은 전부 지운다 — 다른 카테고리로 고른 이력도 이 규칙으로 정리된 것이다
      next.decisions = next.decisions.filter((d) => d.key !== key);
      linkToPrinciple(next, rule.linkToPrincipleId, saved.id);
      return { next, savedId: saved.id, warnings };
    }
    case 'principle': {
      const principle: UserPrinciple = {
        id: newId(),
        text: rule.text,
        topic: rule.topic,
        source: 'user',
        createdAt: now,
        ruleIds: [],
      };
      next.principles.push(principle);
      return { next, savedId: principle.id, warnings };
    }
    case 'interview': {
      if (rule.reset) {
        if (rule.answers) {
          throw new SettleError('INVALID_INPUT', 'reset과 answers는 함께 줄 수 없습니다');
        }
        return { next: resetInterview(next), warnings };
      }
      if (!rule.answers || Object.keys(rule.answers).length === 0) {
        throw new SettleError(
          'INVALID_INPUT',
          'answers가 비어 있습니다. uandi://interview 의 answerShape를 보세요'
        );
      }
      const applied = applyInterviewAnswers(next, rule.answers, categoryNames, now);
      return { next: applied.file, warnings: applied.warnings };
    }
    case 'alias':
      next.aliases[rule.realName] = rule.alias;
      return { next, warnings };
    case 'ignore': {
      compilePattern(rule.pattern);
      const existing = next.ignore.find((r) => r.pattern === rule.pattern);
      const meta = existing ?? newRuleMeta({ source: 'user' }, now);
      next.ignore = next.ignore.filter((r) => r.pattern !== rule.pattern);
      next.ignore.push({
        ...meta,
        rationale: rule.rationale ?? meta.rationale,
        pattern: rule.pattern,
        reason: rule.reason,
        ...(rule.onlyFor ? { onlyFor: rule.onlyFor } : {}),
      });
      linkToPrinciple(next, rule.linkToPrincipleId, meta.id);
      return { next, savedId: meta.id, warnings };
    }
    case 'transfer': {
      compilePattern(rule.pattern);
      const existing = next.transfer.find((r) => r.pattern === rule.pattern);
      const meta = existing ?? newRuleMeta({ source: 'user' }, now);
      next.transfer = next.transfer.filter((r) => r.pattern !== rule.pattern);
      next.transfer.push({
        ...meta,
        rationale: rule.rationale ?? meta.rationale,
        pattern: rule.pattern,
        ...(rule.requireKnownName !== undefined ? { requireKnownName: rule.requireKnownName } : {}),
      });
      linkToPrinciple(next, rule.linkToPrincipleId, meta.id);
      return { next, savedId: meta.id, warnings };
    }
    case 'remove':
      return remove(next, rule, warnings);
  }
}

function remove(
  next: RulesFile,
  rule: Extract<SaveRuleInput['rule'], { kind: 'remove' }>,
  warnings: string[]
): Mutation {
  const removedIds: string[] = [];
  if (rule.id) {
    const found = findRuleById(next, rule.id);
    const principle = next.principles.find((p) => p.id === rule.id);
    if (!found && !principle) {
      throw new SettleError('INVALID_INPUT', `id ${rule.id}인 규칙·기준이 없습니다`);
    }
    if (found) removedIds.push(found.id);
    next.categoryRules = next.categoryRules.filter((r) => r.id !== rule.id);
    next.ignore = next.ignore.filter((r) => r.id !== rule.id);
    next.transfer = next.transfer.filter((r) => r.id !== rule.id);
    next.principles = next.principles.filter((p) => p.id !== rule.id);
  } else if (rule.target && rule.key) {
    switch (rule.target) {
      case 'exactCategory': {
        const key = normalize(rule.key);
        const hit = next.categoryRules.filter(
          (r) => r.match.kind === 'exact' && normalize(r.match.key) === key
        );
        removedIds.push(...hit.map((r) => r.id));
        next.categoryRules = next.categoryRules.filter((r) => !hit.includes(r));
        break;
      }
      case 'alias':
        delete next.aliases[rule.key];
        break;
      case 'ignore': {
        const hit = next.ignore.filter((r) => r.pattern === rule.key);
        removedIds.push(...hit.map((r) => r.id));
        next.ignore = next.ignore.filter((r) => r.pattern !== rule.key);
        break;
      }
      case 'transfer': {
        const hit = next.transfer.filter((r) => r.pattern === rule.key);
        removedIds.push(...hit.map((r) => r.id));
        next.transfer = next.transfer.filter((r) => r.pattern !== rule.key);
        break;
      }
    }
  } else {
    throw new SettleError('INVALID_INPUT', 'remove에는 id 또는 target+key가 필요합니다');
  }
  // 지운 규칙을 가리키던 기준의 연결을 끊는다 (기준 자체는 남긴다 — 말로만 있는 기준이 된다)
  for (const p of next.principles) p.ruleIds = p.ruleIds.filter((id) => !removedIds.includes(id));
  for (const id of removedIds) {
    const w = conflictWarning(conflictsOfRemoval(id), '지웠습니다');
    if (w) warnings.push(w);
  }
  return { next, warnings };
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
    if (row.categorySource !== 'user' && applied.appliedRuleId !== row.appliedRuleId) {
      patch.appliedRuleId = applied.appliedRuleId;
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

  const { next, savedId, warnings } = mutate(
    current.file,
    input.rule,
    categoryNames,
    new Date().toISOString()
  );
  const compiled = compileRules(next);
  await writeRules(deps.rulesPath, next);

  const out: SaveRuleOutput = { rules: next, warnings };
  if (savedId) out.savedId = savedId;
  const batch = await deps.store.latestStagingBatch(session.coupleId);
  if (!batch) return out;
  const changed = await reapplyToBatch(deps, batch, compiled, categoryNames);
  return { ...out, appliedToBatch: { batchId: batch.id, changed } };
}

export function registerSaveRule(server: McpServer, deps: ToolDeps) {
  server.registerTool(
    'save_rule',
    {
      title: '규칙·기준 저장',
      description:
        '로컬 규칙 파일(사용자 PC에만 있음)에 항목을 넣거나 뺀다. kind: exactCategory/categoryRule(적요→카테고리, contains·regex·evenIfTransfer), promote(set_category의 promotable을 규칙으로), principle("배달은 식비로 본다" 같은 사람 말 기준), interview(첫 결산 인터뷰 답), alias(실명→별칭), ignore, transfer, remove(id 또는 target+key). 규칙에는 rationale(왜)을 함께 받는다. 원칙과 어긋나는 저장은 warnings로 알리되 막지 않는다. 커밋 전 배치가 있으면 새 규칙을 다시 적용한다.',
      inputSchema: saveRuleInputShape,
    },
    guarded(async (args) => {
      const out = await saveRule(deps, args as SaveRuleInput);
      const parts = ['규칙 저장 완료'];
      if (out.savedId) parts.push(`id ${out.savedId}`);
      if (out.appliedToBatch) {
        parts.push(
          `배치 ${out.appliedToBatch.batchId}의 ${out.appliedToBatch.changed}건에 다시 적용`
        );
      }
      if (out.warnings.length)
        parts.push(`경고 ${out.warnings.length}건: ${out.warnings.join(' / ')}`);
      return toolResult(parts.join('. '), out);
    })
  );
}
