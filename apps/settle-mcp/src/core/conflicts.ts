import { normalize } from './fingerprint';
import { principleLabel, type PrincipleNo } from './principles';
import {
  DEFAULT_CARD_PAYMENT_PATTERN,
  DEFAULT_CARD_PAYMENT_RULE_ID,
  DEFAULT_TRANSFER_RULE_ID,
  type CategoryRule,
  type RulesFile,
} from './rules';

/**
 * 원칙 6: 기준이 원칙과 어긋나면 서버는 알려 주되 막지 않는다.
 * 여기서는 "어긋남"을 결정적으로 판정한다 — 저장 시 conflictsWith에 기록하고 warnings로 알린다.
 */

const CARD_PAYMENT_WORDS = /카드대금|카드\s*결제|카드값/u;

/** 카테고리 규칙이 어떤 원칙과 어긋나나 */
export function conflictsOfCategoryRule(rule: CategoryRule, file: RulesFile): PrincipleNo[] {
  const out = new Set<PrincipleNo>();
  const text =
    rule.match.kind === 'exact'
      ? rule.match.key
      : rule.match.kind === 'contains'
        ? rule.match.text
        : rule.match.pattern;
  // 원칙 2: 카드대금 출금에 카테고리를 주면 카드 내역서와 이중 집계
  if (
    (rule.match.kind === 'regex' && rule.match.pattern === DEFAULT_CARD_PAYMENT_PATTERN) ||
    CARD_PAYMENT_WORDS.test(text)
  ) {
    out.add(2);
  }
  // 원칙 3: 우리 중 한 사람의 이름을 지출로 기록
  if (rule.evenIfTransfer) {
    const key = normalize(text);
    if (file.insiders.some((name) => key.includes(normalize(name)) || text.includes(name))) {
      out.add(3);
    }
  }
  return [...out];
}

/** 기본 규칙을 지우면 어떤 원칙과 어긋나나 */
export function conflictsOfRemoval(ruleId: string): PrincipleNo[] {
  if (ruleId === DEFAULT_CARD_PAYMENT_RULE_ID) return [2];
  if (ruleId === DEFAULT_TRANSFER_RULE_ID) return [3];
  return [];
}

/** "원칙 2(같은 돈은 한 번만 적는다)와 어긋나지만 저장했습니다" */
export function conflictWarning(nos: readonly number[], what: string): string | null {
  const valid = nos.filter((no): no is PrincipleNo => no >= 1 && no <= 6 && Number.isInteger(no));
  if (valid.length === 0) return null;
  const labels = valid.map((no) =>
    principleLabel(no).replace(/^원칙 (\d+): (.+)$/u, '원칙 $1($2)')
  );
  return `${labels.join('·')}와 어긋나지만 ${what}`;
}
