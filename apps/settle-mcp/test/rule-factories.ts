import {
  defaultRules,
  newRuleMeta,
  type CategoryRule,
  type IgnoreRule,
  type RuleMeta,
  type RulesFile,
  type TransferRule,
} from '../src/core/rules';
import { normalize } from '../src/core/fingerprint';

const NOW = '2026-09-01T00:00:00.000Z';

export const meta = (over: Partial<RuleMeta> = {}): RuleMeta =>
  newRuleMeta({ source: 'user', ...over }, NOW);

export const exactRule = (
  description: string,
  category: string,
  over: Partial<CategoryRule> = {}
): CategoryRule => ({
  ...meta(),
  match: { kind: 'exact', key: normalize(description) },
  category,
  ...over,
});

export const containsRule = (
  text: string,
  category: string,
  over: Partial<CategoryRule> = {}
): CategoryRule => ({ ...meta(), match: { kind: 'contains', text }, category, ...over });

export const regexRule = (
  pattern: string,
  category: string,
  over: Partial<CategoryRule> = {}
): CategoryRule => ({ ...meta(), match: { kind: 'regex', pattern }, category, ...over });

export const ignoreRule = (
  pattern: string,
  reason: string,
  over: Partial<IgnoreRule> = {}
): IgnoreRule => ({
  ...meta(),
  pattern,
  reason,
  ...over,
});

export const transferRule = (pattern: string, over: Partial<TransferRule> = {}): TransferRule => ({
  ...meta(),
  pattern,
  ...over,
});

/** 기본 규칙 위에 일부만 덮어쓴 v2 파일 */
export const rulesWith = (over: Partial<RulesFile>, coupleId = 'c1'): RulesFile => ({
  ...defaultRules(coupleId, NOW),
  ...over,
});
