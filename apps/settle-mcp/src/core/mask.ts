import { normalize } from './fingerprint';
import type { CategoryRule, RulesFile } from './rules';

/**
 * 실명 가림 (docs/09-settle-mcp.md §6.1·§11.5). UANDI_EXPOSE_ALIASES=false인 사용자용 —
 * LLM 제공자에게 실명을 보내지 않는다. 치환은 코드가 하므로 LLM이 실명을 몰라도 결과는 같다.
 * aliases 키마다 "<실명 N>" 라벨을 만들고, 규칙 키·패턴·예시·결정 로그·insiders 속의 실명을 같은 라벨로 바꾼다.
 */
export type Masker = {
  text(s: string): string;
  insider(name: string): string;
  rule<T extends { examples: string[] }>(rule: T): T;
  categoryRule(rule: CategoryRule): CategoryRule;
  file(rules: RulesFile): RulesFile;
};

export function createMasker(rules: RulesFile): Masker {
  const label = new Map<string, string>();
  Object.keys(rules.aliases).forEach((real, i) => {
    label.set(real, `<실명 ${i + 1}>`);
    // 규칙 키·결정 로그 키는 normalize된 형태라 공백 없는 변형도 같은 라벨로
    const normalized = normalize(real);
    if (normalized && !label.has(normalized)) label.set(normalized, `<실명 ${i + 1}>`);
  });
  const longestFirst = [...label.keys()].sort((a, b) => b.length - a.length);

  const text = (s: string) => {
    let out = s;
    for (const real of longestFirst) {
      if (out.includes(real)) out = out.split(real).join(label.get(real)!);
    }
    return out;
  };
  const rule = <T extends { examples: string[] }>(r: T): T => ({
    ...r,
    examples: r.examples.map(text),
  });
  const match = (m: CategoryRule['match']): CategoryRule['match'] => {
    switch (m.kind) {
      case 'exact':
        return { kind: 'exact', key: text(m.key) };
      case 'contains':
        return { kind: 'contains', text: text(m.text) };
      case 'regex':
        return { kind: 'regex', pattern: text(m.pattern) };
    }
  };
  const categoryRule = (r: CategoryRule): CategoryRule => ({ ...rule(r), match: match(r.match) });
  const insider = (name: string) => label.get(name) ?? '<실명>';

  return {
    text,
    insider,
    rule,
    categoryRule,
    file: (f) => ({
      ...f,
      aliases: Object.fromEntries(
        Object.entries(f.aliases).map(([real, alias]) => [label.get(real)!, alias])
      ),
      insiders: f.insiders.map(insider),
      categoryRules: f.categoryRules.map(categoryRule),
      ignore: f.ignore.map((r) => ({ ...rule(r), pattern: text(r.pattern) })),
      transfer: f.transfer.map((r) => ({ ...rule(r), pattern: text(r.pattern) })),
      decisions: f.decisions.map((d) => ({ ...d, key: text(d.key), sample: text(d.sample) })),
    }),
  };
}

/** 아무것도 가리지 않는 마스커 — exposeAliases=true일 때 같은 코드 경로를 쓰기 위해 */
export const identityMasker: Masker = {
  text: (s) => s,
  insider: (n) => n,
  rule: (r) => r,
  categoryRule: (r) => r,
  file: (f) => f,
};
