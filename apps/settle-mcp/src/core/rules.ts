import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import { SettleError } from './errors';
import { normalize } from './fingerprint';
import { newId } from './id';
import { principleLabel } from './principles';
import type { CategorySource, EntryType, SourceKind, StagedStatus } from './types';

// ── 공통 ──

const MAX_PATTERN_LENGTH = 200;
/** 규칙이 잡은 적요 예시를 몇 개까지 남기나 (점검 때 보여 준다) */
export const MAX_RULE_EXAMPLES = 3;

const ruleScopeSchema = z
  .object({
    sourceKind: z.enum(['account', 'card']).optional(),
    type: z.enum(['income', 'expense']).optional(),
  })
  .strict();

export type RuleScope = z.infer<typeof ruleScopeSchema>;

const patternSchema = z.string().min(1).max(MAX_PATTERN_LENGTH);

// ── v1 스키마 (docs/09-settle-mcp.md §4.4) — 로드 시 v2로 승격한다 ──

const ignoreRuleV1Schema = z
  .object({
    pattern: patternSchema,
    reason: z.string().min(1).max(200),
    onlyFor: ruleScopeSchema.optional(),
  })
  .strict();

const transferRuleV1Schema = z
  .object({ pattern: patternSchema, requireKnownName: z.boolean().optional() })
  .strict();

export const rulesFileV1Schema = z
  .object({
    version: z.literal(1),
    coupleId: z.string().min(1),
    exactCategory: z.record(z.string(), z.string().min(1)),
    ignore: z.array(ignoreRuleV1Schema),
    transfer: z.array(transferRuleV1Schema),
    aliases: z.record(z.string().min(1), z.string().min(1)),
  })
  .strict();

export type RulesFileV1 = z.infer<typeof rulesFileV1Schema>;

// ── v2 스키마 (docs/09-settle-mcp.md §11.3) ──

const principleNoSchema = z.number().int().min(1).max(6);

/** 모든 기계 규칙의 공통 메타. 별칭(aliases)은 '사전'이라 메타가 없다 */
const ruleMetaSchema = z.object({
  id: z.string().min(1),
  /** "왜" — 비어 있으면 review_playbook이 보여 준다 */
  rationale: z.string().max(200).nullable(),
  source: z.enum(['default', 'interview', 'user', 'promoted']),
  createdAt: z.string(),
  hits: z.number().int().min(0),
  lastHitAt: z.string().nullable(),
  /** 이 규칙이 잡은 적요 원문 예시. 로컬에만 남고 리소스에선 실명을 가린다 */
  examples: z.array(z.string()).max(MAX_RULE_EXAMPLES),
  /** 저장 시 어긋나는 원칙 번호(1~6). 원칙 6: 경고하되 막지 않는다 */
  conflictsWith: z.array(principleNoSchema),
});

export type RuleMeta = z.infer<typeof ruleMetaSchema>;

const categoryMatchSchema = z.discriminatedUnion('kind', [
  /** normalize(적요) 전체 일치. v1 exactCategory */
  z.object({ kind: z.literal('exact'), key: z.string().min(1).max(200) }).strict(),
  /** normalize(적요)가 normalize(text)를 포함 */
  z.object({ kind: z.literal('contains'), text: z.string().min(1).max(200) }).strict(),
  /** u 플래그 정규식. rawDescription에 적용 */
  z.object({ kind: z.literal('regex'), pattern: patternSchema }).strict(),
]);

export type CategoryMatch = z.infer<typeof categoryMatchSchema>;

const categoryRuleSchema = ruleMetaSchema
  .extend({
    match: categoryMatchSchema,
    category: z.string().min(1).max(50),
    onlyFor: ruleScopeSchema.optional(),
    /** 송금 패턴·insiders에 맞아도 이 카테고리의 거래로 기록한다 (근거 D-2) */
    evenIfTransfer: z.boolean().optional(),
  })
  .strict();

const ignoreRuleSchema = ruleMetaSchema
  .extend({
    pattern: patternSchema,
    reason: z.string().min(1).max(200),
    onlyFor: ruleScopeSchema.optional(),
  })
  .strict();

const transferRuleSchema = ruleMetaSchema
  .extend({ pattern: patternSchema, requireKnownName: z.boolean().optional() })
  .strict();

const userPrincipleSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1).max(200),
    topic: z.enum(['category', 'duplicate', 'transfer', 'cash', 'refund', 'other']),
    source: z.enum(['interview', 'user']),
    createdAt: z.string(),
    /** 이 기준을 기계 규칙으로 옮긴 것. 비어 있으면 '말로만 있는 기준' */
    ruleIds: z.array(z.string()),
  })
  .strict();

/** 집계형 결정 로그. 키는 normalize(rawDescription) */
const decisionSchema = z
  .object({
    key: z.string().min(1),
    sample: z.string(),
    category: z.string().min(1),
    count: z.number().int().min(1),
    lastAt: z.string(),
    lastBatchId: z.string(),
  })
  .strict();

export const INTERVIEW_QUESTION_IDS = [
  'cardPayment',
  'partnerName',
  'thirdParty',
  'cashRefund',
] as const;

export type InterviewQuestionId = (typeof INTERVIEW_QUESTION_IDS)[number];

const interviewSchema = z
  .object({
    completedAt: z.string().nullable(),
    answers: z
      .object({
        cardPayment: z.string().optional(),
        partnerName: z.string().optional(),
        thirdParty: z.string().optional(),
        cashRefund: z.string().optional(),
      })
      .strict(),
  })
  .strict();

export const rulesFileSchema = z
  .object({
    version: z.literal(2),
    coupleId: z.string().min(1),
    /** 사용자가 사람 말로 세운 기준 */
    principles: z.array(userPrincipleSchema),
    /** 적요 → 카테고리. exact → contains → regex 순으로 적용 */
    categoryRules: z.array(categoryRuleSchema),
    ignore: z.array(ignoreRuleSchema),
    transfer: z.array(transferRuleSchema),
    /** 실명 → 별칭. 키는 원문 그대로(공백 포함) */
    aliases: z.record(z.string().min(1), z.string().min(1)),
    /** 원칙 3의 "우리": 서로의 이름. 적요에 보이면 송금 패턴이 없어도 transfer */
    insiders: z.array(z.string().min(1)),
    decisions: z.array(decisionSchema),
    interview: interviewSchema,
  })
  .strict();

export type RulesFile = z.infer<typeof rulesFileSchema>;
export type CategoryRule = z.infer<typeof categoryRuleSchema>;
export type IgnoreRule = z.infer<typeof ignoreRuleSchema>;
export type TransferRule = z.infer<typeof transferRuleSchema>;
export type UserPrinciple = z.infer<typeof userPrincipleSchema>;
export type Decision = z.infer<typeof decisionSchema>;
export type AnyRule = CategoryRule | IgnoreRule | TransferRule;

// ── 기본값 ──

/** 현재 서버 프롬프트(parse-entries-core)의 카드대금·송금 규칙을 정규식으로 옮긴 기본값 */
export const DEFAULT_CARD_PAYMENT_PATTERN =
  '(카드대금|카드\\s*결제|신용카드|체크카드\\s*정산|(신한|삼성|현대|국민|KB|롯데|하나|우리|BC|NH|농협)\\s*카드)';

export const DEFAULT_TRANSFER_PATTERN = '(이체|송금|카카오페이|토스|ATM|현금\\s*출금|인출)';

/** 기본 규칙은 고정 ID — 승격·충돌 검사·점검(unused 제외)에서 알아본다 */
export const DEFAULT_CARD_PAYMENT_RULE_ID = 'default-card-payment';
export const DEFAULT_TRANSFER_RULE_ID = 'default-transfer';

export function newRuleMeta(
  over: Partial<RuleMeta> & Pick<RuleMeta, 'source'>,
  now: string = new Date().toISOString()
): RuleMeta {
  return {
    id: newId(),
    rationale: null,
    createdAt: now,
    hits: 0,
    lastHitAt: null,
    examples: [],
    conflictsWith: [],
    ...over,
  };
}

export function defaultRules(coupleId: string, now: string = new Date().toISOString()): RulesFile {
  return {
    version: 2,
    coupleId,
    principles: [],
    categoryRules: [],
    ignore: [
      {
        ...newRuleMeta(
          { id: DEFAULT_CARD_PAYMENT_RULE_ID, source: 'default', rationale: principleLabel(2) },
          now
        ),
        pattern: DEFAULT_CARD_PAYMENT_PATTERN,
        reason: '카드대금 일괄출금 — 카드 내역서에서 따로 집계하므로 이중 집계 방지',
        onlyFor: { sourceKind: 'account', type: 'expense' },
      },
    ],
    transfer: [
      {
        ...newRuleMeta(
          { id: DEFAULT_TRANSFER_RULE_ID, source: 'default', rationale: principleLabel(3) },
          now
        ),
        pattern: DEFAULT_TRANSFER_PATTERN,
      },
    ],
    aliases: {},
    insiders: [],
    decisions: [],
    interview: { completedAt: null, answers: {} },
  };
}

/**
 * v1 → v2 승격 (§11.3 승격 표). 메모리에서만 바꾸고, 저장은 다음 쓰기 때 일어난다.
 * - exactCategory → match.kind='exact' 카테고리 규칙, source 'user'
 * - 기본 패턴과 같은 ignore·transfer → 고정 ID + source 'default' + 원칙 rationale
 * - principles·insiders·decisions 비움, interview 미완료 → 첫 결산 인터뷰가 켜진다
 */
export function migrateV1ToV2(v1: RulesFileV1, now: string = new Date().toISOString()): RulesFile {
  const categoryRules: CategoryRule[] = Object.entries(v1.exactCategory).map(([key, category]) => ({
    ...newRuleMeta({ source: 'user' }, now),
    match: { kind: 'exact', key },
    category,
  }));
  const ignore: IgnoreRule[] = v1.ignore.map((r) => {
    const isDefault = r.pattern === DEFAULT_CARD_PAYMENT_PATTERN;
    return {
      ...newRuleMeta(
        isDefault
          ? { id: DEFAULT_CARD_PAYMENT_RULE_ID, source: 'default', rationale: principleLabel(2) }
          : { source: 'user' },
        now
      ),
      pattern: r.pattern,
      reason: r.reason,
      ...(r.onlyFor ? { onlyFor: r.onlyFor } : {}),
    };
  });
  const transfer: TransferRule[] = v1.transfer.map((r) => {
    const isDefault = r.pattern === DEFAULT_TRANSFER_PATTERN;
    return {
      ...newRuleMeta(
        isDefault
          ? { id: DEFAULT_TRANSFER_RULE_ID, source: 'default', rationale: principleLabel(3) }
          : { source: 'user' },
        now
      ),
      pattern: r.pattern,
      ...(r.requireKnownName !== undefined ? { requireKnownName: r.requireKnownName } : {}),
    };
  });
  return {
    version: 2,
    coupleId: v1.coupleId,
    principles: [],
    categoryRules,
    ignore,
    transfer,
    aliases: { ...v1.aliases },
    insiders: [],
    decisions: [],
    interview: { completedAt: null, answers: {} },
  };
}

// ── 패턴 검증 ──

export function compilePattern(pattern: string): RegExp {
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new SettleError('INVALID_PATTERN', `패턴은 ${MAX_PATTERN_LENGTH}자 이하여야 합니다`);
  }
  let re: RegExp;
  try {
    re = new RegExp(pattern, 'u');
  } catch (e) {
    throw new SettleError('INVALID_PATTERN', `정규식이 올바르지 않습니다: ${(e as Error).message}`);
  }
  if (re.test('')) {
    throw new SettleError('PATTERN_TOO_BROAD', '빈 문자열에도 일치하는 패턴은 쓸 수 없습니다');
  }
  return re;
}

/** exact·contains 키는 normalize 후 비어 있지 않아야 한다 ("  ", "---" 같은 키 거절) */
export function normalizedKeyOf(text: string): string {
  const key = normalize(text);
  if (!key) throw new SettleError('INVALID_INPUT', '적요가 비어 있습니다');
  return key;
}

/** 파일 전체의 패턴을 컴파일해 둔 형태. 로드 시 한 번 만들고 행마다 재사용한다 */
export type CompiledRules = {
  file: RulesFile;
  ignore: { rule: IgnoreRule; re: RegExp }[];
  transfer: { rule: TransferRule; re: RegExp }[];
  /** normalize된 키 → 그 키의 exact 규칙들 (둘 이상이면 먼저 저장된 것이 이기고 나머지는 충돌) */
  categoryExact: Map<string, CategoryRule[]>;
  /** 긴 text부터 — 더 좁은 규칙이 이긴다 (근거 B-5) */
  categoryContains: { rule: CategoryRule; key: string }[];
  /** 파일 순서 — 먼저 저장된 것이 이긴다 */
  categoryRegex: { rule: CategoryRule; re: RegExp }[];
  /** 긴 실명부터 치환해야 "김영희"가 "영희"보다 먼저 잡힌다 */
  aliasKeys: string[];
  /** 긴 이름부터 */
  insiders: string[];
};

export function compileRules(file: RulesFile): CompiledRules {
  const categoryExact = new Map<string, CategoryRule[]>();
  const categoryContains: CompiledRules['categoryContains'] = [];
  const categoryRegex: CompiledRules['categoryRegex'] = [];
  for (const rule of file.categoryRules) {
    switch (rule.match.kind) {
      case 'exact': {
        const key = normalizedKeyOf(rule.match.key);
        const list = categoryExact.get(key);
        if (list) list.push(rule);
        else categoryExact.set(key, [rule]);
        break;
      }
      case 'contains':
        categoryContains.push({ rule, key: normalizedKeyOf(rule.match.text) });
        break;
      case 'regex':
        categoryRegex.push({ rule, re: compilePattern(rule.match.pattern) });
        break;
    }
  }
  // 안정 정렬: 길이 같으면 파일 순서 유지
  categoryContains.sort((a, b) => b.key.length - a.key.length);
  return {
    file,
    ignore: file.ignore.map((rule) => ({ rule, re: compilePattern(rule.pattern) })),
    transfer: file.transfer.map((rule) => ({ rule, re: compilePattern(rule.pattern) })),
    categoryExact,
    categoryContains,
    categoryRegex,
    aliasKeys: Object.keys(file.aliases).sort((a, b) => b.length - a.length),
    insiders: [...file.insiders].sort((a, b) => b.length - a.length),
  };
}

// ── 파일 입출력 ──

/** v1 원본 보관 위치: rules.json → rules.v1.bak.json */
export function rulesBackupPath(path: string): string {
  return path.replace(/\.json$/u, '') + '.v1.bak.json';
}

/**
 * 규칙 파일을 읽어 검증한다. 없으면 기본 파일을 만든다. v1이면 원본을 백업하고 메모리에서 v2로 승격한다.
 * 깨진 파일이면 RULES_INVALID — 호출한 도구는 어떤 쓰기도 하지 않는다.
 */
export async function loadRules(path: string, coupleId: string): Promise<CompiledRules> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw new SettleError('RULES_INVALID', `규칙 파일을 읽을 수 없습니다: ${path}`, {
        cause: (e as Error).message,
      });
    }
    const fresh = defaultRules(coupleId);
    await writeRules(path, fresh);
    return compileRules(fresh);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new SettleError('RULES_INVALID', `규칙 파일이 올바른 JSON이 아닙니다: ${path}`);
  }

  const version = (json as { version?: unknown } | null)?.version;
  let file: RulesFile;
  if (version === 1) {
    const parsed = rulesFileV1Schema.safeParse(json);
    if (!parsed.success) throw invalidShape(path, parsed.error);
    assertCouple(parsed.data.coupleId, coupleId, path);
    await backupV1(path, raw);
    file = migrateV1ToV2(parsed.data);
  } else {
    const parsed = rulesFileSchema.safeParse(json);
    if (!parsed.success) throw invalidShape(path, parsed.error);
    assertCouple(parsed.data.coupleId, coupleId, path);
    file = parsed.data;
  }

  try {
    return compileRules(file);
  } catch (e) {
    if (e instanceof SettleError) {
      throw new SettleError('RULES_INVALID', `규칙 파일의 패턴이 올바르지 않습니다: ${e.message}`);
    }
    throw e;
  }
}

function invalidShape(path: string, error: z.ZodError): SettleError {
  return new SettleError('RULES_INVALID', `규칙 파일 형식이 맞지 않습니다: ${path}`, {
    issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  });
}

function assertCouple(fileCoupleId: string, coupleId: string, path: string): void {
  if (fileCoupleId !== coupleId) {
    throw new SettleError(
      'RULES_INVALID',
      `규칙 파일이 다른 커플(${fileCoupleId})의 것입니다. 파일을 옮기거나 지운 뒤 다시 시도하세요: ${path}`
    );
  }
}

/** 백업은 한 번만 — 이미 있으면 덮어쓰지 않는다 (처음 승격한 시점의 원본이 남아야 한다) */
async function backupV1(path: string, raw: string): Promise<void> {
  const backup = rulesBackupPath(path);
  try {
    await writeFile(backup, raw, { encoding: 'utf8', flag: 'wx' });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') return;
    throw new SettleError('RULES_WRITE_FAILED', `v1 규칙 파일을 백업할 수 없습니다: ${backup}`, {
      cause: (e as Error).message,
    });
  }
}

/** 임시 파일에 쓴 뒤 rename — 중간에 죽어도 반쪽짜리 파일이 남지 않는다 */
export async function writeRules(path: string, rules: RulesFile): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    const tmp = `${path}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(rules, null, 2) + '\n', 'utf8');
    await rename(tmp, path);
  } catch (e) {
    throw new SettleError('RULES_WRITE_FAILED', `규칙 파일을 쓸 수 없습니다: ${path}`, {
      cause: (e as Error).message,
    });
  }
}

// ── 조회 ──

export function allRules(file: RulesFile): AnyRule[] {
  return [...file.categoryRules, ...file.ignore, ...file.transfer];
}

export function findRuleById(file: RulesFile, id: string): AnyRule | null {
  return allRules(file).find((r) => r.id === id) ?? null;
}

// ── 적용 ──

function scopeMatches(
  scope: RuleScope | undefined,
  sourceKind: SourceKind,
  type: EntryType
): boolean {
  if (scope?.sourceKind && scope.sourceKind !== sourceKind) return false;
  if (scope?.type && scope.type !== type) return false;
  return true;
}

/** 실명 → 별칭 치환. 부분 문자열("홍길동님")도 치환된다 */
export function applyAliases(text: string, rules: CompiledRules): string {
  let out = text;
  for (const key of rules.aliasKeys) {
    if (out.includes(key)) out = out.split(key).join(rules.file.aliases[key]!);
  }
  return out;
}

/** 치환이 끝난 적요에 실명이 하나라도 남아 있는가 (커밋 직전 ALIAS_LEAK 검사) */
export function findAliasLeak(text: string, rules: CompiledRules): string | null {
  for (const key of rules.aliasKeys) {
    if (text.includes(key)) return key;
  }
  return null;
}

export function matchIgnore(
  rawDescription: string,
  type: EntryType,
  sourceKind: SourceKind,
  rules: CompiledRules
): IgnoreRule | null {
  for (const { rule, re } of rules.ignore) {
    if (!scopeMatches(rule.onlyFor, sourceKind, type)) continue;
    if (re.test(rawDescription)) return rule;
  }
  return null;
}

export type TransferMatch =
  | { kind: 'pattern'; rule: TransferRule }
  /** 적요에 "우리" 중 한 사람의 이름이 있다 (원칙 3). 패턴 규칙 없이도 송금이다 */
  | { kind: 'insider'; name: string };

export function matchTransfer(rawDescription: string, rules: CompiledRules): TransferMatch | null {
  for (const { rule, re } of rules.transfer) {
    if (!re.test(rawDescription)) continue;
    if (rule.requireKnownName && !rules.aliasKeys.some((k) => rawDescription.includes(k))) continue;
    return { kind: 'pattern', rule };
  }
  for (const name of rules.insiders) {
    if (rawDescription.includes(name)) return { kind: 'insider', name };
  }
  return null;
}

export type CategoryMatchResult = {
  applied: CategoryRule | null;
  /** 같은 단계에서 함께 맞았지만 더 넓어서 밀린 규칙들 (근거 B-5) */
  conflicts: CategoryRule[];
};

/**
 * 카테고리 규칙 적용 — exact → contains → regex. 먼저 맞은 단계에서 끝난다.
 * 같은 단계에서 둘 이상 맞으면 더 좁은 것(exact: 먼저 저장된 것 / contains: text가 긴 것 / regex: 먼저 저장된 것)을
 * 쓰고 나머지를 conflicts로 돌려준다. 카테고리가 목록에 없는 규칙과 onlyFor가 안 맞는 규칙은 없는 것으로 친다.
 */
export function matchCategory(
  rawDescription: string,
  type: EntryType,
  sourceKind: SourceKind,
  rules: CompiledRules,
  categoryNames: ReadonlySet<string>
): CategoryMatchResult {
  const usable = (rule: CategoryRule) =>
    categoryNames.has(rule.category) && scopeMatches(rule.onlyFor, sourceKind, type);
  const pick = (matched: CategoryRule[]): CategoryMatchResult | null =>
    matched.length === 0 ? null : { applied: matched[0]!, conflicts: matched.slice(1) };

  const key = normalize(rawDescription);
  const exact = pick((rules.categoryExact.get(key) ?? []).filter(usable));
  if (exact) return exact;

  const contains = pick(
    rules.categoryContains
      .filter(({ rule, key: needle }) => usable(rule) && key.includes(needle))
      .map(({ rule }) => rule)
  );
  if (contains) return contains;

  const regex = pick(
    rules.categoryRegex
      .filter(({ rule, re }) => usable(rule) && re.test(rawDescription))
      .map(({ rule }) => rule)
  );
  if (regex) return regex;

  return { applied: null, conflicts: [] };
}

export type RuleApplication = {
  status: Extract<StagedStatus, 'pending' | 'ignored' | 'transfer'>;
  statusReason: string | null;
  description: string;
  category: string | null;
  categorySource: CategorySource | null;
  /** 카테고리를 정한 규칙. LLM 후보·없음이면 null */
  appliedRuleId: string | null;
  /** 함께 맞았지만 밀린 카테고리 규칙 */
  conflictRuleIds: string[];
  /** 이 행에 실제로 적용된 규칙 전부(무시·카테고리·송금). hits 집계용 */
  hitRuleIds: string[];
};

/**
 * 스테이징 한 행에 규칙을 적용한다 (§11.3 적용 순서 1~4). 배치 내 지문·기존 내역 대조는 포함하지 않는다.
 * - LLM 후보 카테고리가 목록에 없으면 null (임의 카테고리 생성 금지)
 * - 카테고리 규칙은 LLM 후보를 덮어쓴다
 * - evenIfTransfer 카테고리 규칙은 송금 판정을 이긴다 (근거 D-2)
 */
export function applyRules(
  row: { rawDescription: string; type: EntryType; llmCategory: string | null },
  sourceKind: SourceKind,
  rules: CompiledRules,
  categoryNames: ReadonlySet<string>
): RuleApplication {
  const description = applyAliases(row.rawDescription, rules);
  const hitRuleIds: string[] = [];

  const matched = matchCategory(row.rawDescription, row.type, sourceKind, rules, categoryNames);
  let category: string | null = null;
  let categorySource: CategorySource | null = null;
  if (matched.applied) {
    category = matched.applied.category;
    categorySource = 'rule';
  } else if (row.llmCategory && categoryNames.has(row.llmCategory)) {
    category = row.llmCategory;
    categorySource = 'llm';
  }
  const base = {
    description,
    category,
    categorySource,
    appliedRuleId: matched.applied?.id ?? null,
    conflictRuleIds: matched.conflicts.map((r) => r.id),
  };

  const ignored = matchIgnore(row.rawDescription, row.type, sourceKind, rules);
  if (ignored) {
    return {
      ...base,
      status: 'ignored',
      statusReason: `ignore:${ignored.reason}`,
      hitRuleIds: [ignored.id],
    };
  }
  if (matched.applied) hitRuleIds.push(matched.applied.id);

  const transfer = matchTransfer(row.rawDescription, rules);
  if (transfer && !matched.applied?.evenIfTransfer) {
    if (transfer.kind === 'pattern') {
      hitRuleIds.push(transfer.rule.id);
      return {
        ...base,
        status: 'transfer',
        statusReason: `transfer:${transfer.rule.pattern}`,
        hitRuleIds,
      };
    }
    // 실명은 statusReason에 남기지 않는다 — 별칭이 있으면 별칭으로
    const shown = rules.file.aliases[transfer.name] ?? '우리';
    return { ...base, status: 'transfer', statusReason: `transfer:insider:${shown}`, hitRuleIds };
  }

  return { ...base, status: 'pending', statusReason: null, hitRuleIds };
}

// ── 적용 횟수 ──

/**
 * 규칙이 적용된 기록을 메타에 남긴다 (근거 E-3: 쓰이지 않는 규칙을 찾기 위해).
 * 원본은 바꾸지 않고 새 파일을 돌려준다. 모르는 id는 무시한다. 예시는 중복 없이 MAX_RULE_EXAMPLES개까지.
 */
export function recordHits(
  file: RulesFile,
  hits: { ruleId: string; rawDescription: string }[],
  now: string = new Date().toISOString()
): RulesFile {
  if (hits.length === 0) return file;
  const next = structuredClone(file);
  const byId = new Map(allRules(next).map((r) => [r.id, r]));
  for (const { ruleId, rawDescription } of hits) {
    const rule = byId.get(ruleId);
    if (!rule) continue;
    rule.hits += 1;
    rule.lastHitAt = now;
    if (rule.examples.length < MAX_RULE_EXAMPLES && !rule.examples.includes(rawDescription)) {
      rule.examples.push(rawDescription);
    }
  }
  return next;
}
