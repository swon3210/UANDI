import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import { SettleError } from './errors';
import { normalize } from './fingerprint';
import type { CategorySource, EntryType, SourceKind, StagedStatus } from './types';

// ── 스키마 (docs/09-settle-mcp.md §4.4) ──

const MAX_PATTERN_LENGTH = 200;

const ruleScopeSchema = z
  .object({
    sourceKind: z.enum(['account', 'card']).optional(),
    type: z.enum(['income', 'expense']).optional(),
  })
  .strict();

export type RuleScope = z.infer<typeof ruleScopeSchema>;

const ignoreRuleSchema = z
  .object({
    /** 정규식 문자열 (u 플래그). normalize 전 rawDescription에 적용 */
    pattern: z.string().min(1).max(MAX_PATTERN_LENGTH),
    reason: z.string().min(1).max(200),
    /** 적용 범위. 없으면 모든 내역서·모든 type에 적용. 기본 카드대금 규칙은 account+expense 한정 */
    onlyFor: ruleScopeSchema.optional(),
  })
  .strict();

const transferRuleSchema = z
  .object({
    pattern: z.string().min(1).max(MAX_PATTERN_LENGTH),
    /** true면 pattern 일치 + 적요에 aliases 키(실명)가 포함될 때만 송금으로 본다 */
    requireKnownName: z.boolean().optional(),
  })
  .strict();

export const rulesFileSchema = z
  .object({
    version: z.literal(1),
    coupleId: z.string().min(1),
    /** 적요 정확 일치 → 카테고리. 키는 normalize() 결과 */
    exactCategory: z.record(z.string(), z.string().min(1)),
    ignore: z.array(ignoreRuleSchema),
    transfer: z.array(transferRuleSchema),
    /** 실명 → 별칭. 키는 원문 그대로(공백 포함) */
    aliases: z.record(z.string().min(1), z.string().min(1)),
  })
  .strict();

export type RulesFile = z.infer<typeof rulesFileSchema>;
export type IgnoreRule = z.infer<typeof ignoreRuleSchema>;
export type TransferRule = z.infer<typeof transferRuleSchema>;

/** 현재 서버 프롬프트(parse-entries-core)의 카드대금·송금 규칙을 정규식으로 옮긴 기본값 */
export const DEFAULT_CARD_PAYMENT_PATTERN =
  '(카드대금|카드\\s*결제|신용카드|체크카드\\s*정산|(신한|삼성|현대|국민|KB|롯데|하나|우리|BC|NH|농협)\\s*카드)';

export const DEFAULT_TRANSFER_PATTERN = '(이체|송금|카카오페이|토스|ATM|현금\\s*출금|인출)';

export function defaultRules(coupleId: string): RulesFile {
  return {
    version: 1,
    coupleId,
    exactCategory: {},
    ignore: [
      {
        pattern: DEFAULT_CARD_PAYMENT_PATTERN,
        reason: '카드대금 일괄출금 — 카드 내역서에서 따로 집계하므로 이중 집계 방지',
        onlyFor: { sourceKind: 'account', type: 'expense' },
      },
    ],
    transfer: [{ pattern: DEFAULT_TRANSFER_PATTERN }],
    aliases: {},
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

/** 파일 전체의 패턴을 컴파일해 둔 형태. 로드 시 한 번 만들고 행마다 재사용한다 */
export type CompiledRules = {
  file: RulesFile;
  ignore: { rule: IgnoreRule; re: RegExp }[];
  transfer: { rule: TransferRule; re: RegExp }[];
  /** 긴 실명부터 치환해야 "김영희"가 "영희"보다 먼저 잡힌다 */
  aliasKeys: string[];
};

export function compileRules(file: RulesFile): CompiledRules {
  return {
    file,
    ignore: file.ignore.map((rule) => ({ rule, re: compilePattern(rule.pattern) })),
    transfer: file.transfer.map((rule) => ({ rule, re: compilePattern(rule.pattern) })),
    aliasKeys: Object.keys(file.aliases).sort((a, b) => b.length - a.length),
  };
}

// ── 파일 입출력 ──

/**
 * 규칙 파일을 읽어 검증한다. 없으면 기본 파일을 만든다.
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
  const parsed = rulesFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new SettleError('RULES_INVALID', `규칙 파일 형식이 맞지 않습니다: ${path}`, {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (parsed.data.coupleId !== coupleId) {
    throw new SettleError(
      'RULES_INVALID',
      `규칙 파일이 다른 커플(${parsed.data.coupleId})의 것입니다. 파일을 옮기거나 지운 뒤 다시 시도하세요: ${path}`
    );
  }
  try {
    return compileRules(parsed.data);
  } catch (e) {
    if (e instanceof SettleError) {
      throw new SettleError('RULES_INVALID', `규칙 파일의 패턴이 올바르지 않습니다: ${e.message}`);
    }
    throw e;
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

// ── 적용 ──

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
    const scope = rule.onlyFor;
    if (scope?.sourceKind && scope.sourceKind !== sourceKind) continue;
    if (scope?.type && scope.type !== type) continue;
    if (re.test(rawDescription)) return rule;
  }
  return null;
}

export function matchTransfer(rawDescription: string, rules: CompiledRules): TransferRule | null {
  for (const { rule, re } of rules.transfer) {
    if (!re.test(rawDescription)) continue;
    if (rule.requireKnownName && !rules.aliasKeys.some((k) => rawDescription.includes(k))) continue;
    return rule;
  }
  return null;
}

export function exactCategoryOf(rawDescription: string, rules: CompiledRules): string | null {
  return rules.file.exactCategory[normalize(rawDescription)] ?? null;
}

export type RuleApplication = {
  status: Extract<StagedStatus, 'pending' | 'ignored' | 'transfer'>;
  statusReason: string | null;
  description: string;
  category: string | null;
  categorySource: CategorySource | null;
};

/**
 * 스테이징 한 행에 규칙을 적용한다 (§5.1 처리 순서 2-i ~ 2-iv). 기존 내역 대조는 포함하지 않는다.
 * - LLM 후보 카테고리가 목록에 없으면 null (임의 카테고리 생성 금지)
 * - 정확일치 규칙은 LLM 후보를 덮어쓴다
 */
export function applyRules(
  row: { rawDescription: string; type: EntryType; llmCategory: string | null },
  sourceKind: SourceKind,
  rules: CompiledRules,
  categoryNames: ReadonlySet<string>
): RuleApplication {
  const description = applyAliases(row.rawDescription, rules);

  const ruleCategory = exactCategoryOf(row.rawDescription, rules);
  let category: string | null = null;
  let categorySource: CategorySource | null = null;
  if (ruleCategory && categoryNames.has(ruleCategory)) {
    category = ruleCategory;
    categorySource = 'rule';
  } else if (row.llmCategory && categoryNames.has(row.llmCategory)) {
    category = row.llmCategory;
    categorySource = 'llm';
  }

  const ignored = matchIgnore(row.rawDescription, row.type, sourceKind, rules);
  if (ignored) {
    return {
      status: 'ignored',
      statusReason: `ignore:${ignored.reason}`,
      description,
      category,
      categorySource,
    };
  }

  const transfer = matchTransfer(row.rawDescription, rules);
  if (transfer) {
    return {
      status: 'transfer',
      statusReason: `transfer:${transfer.pattern}`,
      description,
      category,
      categorySource,
    };
  }

  return { status: 'pending', statusReason: null, description, category, categorySource };
}
