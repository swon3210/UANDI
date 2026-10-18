import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { normalize } from '../core/fingerprint';
import { INTERVIEW_QUESTIONS } from '../core/interview';
import type { CategoryRule, RulesFile } from '../core/rules';
import { readPrinciplesMarkdown } from './principles';
import { loadSessionRules, type ToolDeps } from '../tools/shared';

export const CATEGORIES_URI = 'uandi://categories';
export const RULES_URI = 'uandi://rules';
export const PRINCIPLES_URI = 'uandi://principles';
export const INTERVIEW_URI = 'uandi://interview';

/**
 * 실명을 가린 규칙 — LLM 제공자에게 실명을 보내고 싶지 않은 사용자용 (§6.1).
 * aliases 키·insiders는 "<실명 N>"으로, 규칙 예시(examples)·결정 로그 sample 속의 실명도 같은 라벨로 바꾼다.
 * 치환은 코드가 하므로 LLM이 실명을 몰라도 결과는 같다.
 */
export function maskAliases(rules: RulesFile): RulesFile {
  const label = new Map<string, string>();
  Object.keys(rules.aliases).forEach((real, i) => {
    label.set(real, `<실명 ${i + 1}>`);
    // 규칙 키·결정 로그 키는 normalize된 형태라 공백 없는 변형도 같은 라벨로
    const normalized = normalize(real);
    if (normalized && !label.has(normalized)) label.set(normalized, `<실명 ${i + 1}>`);
  });
  const longestFirst = [...label.keys()].sort((a, b) => b.length - a.length);
  const maskText = (text: string) => {
    let out = text;
    for (const real of longestFirst) {
      if (out.includes(real)) out = out.split(real).join(label.get(real)!);
    }
    return out;
  };
  const maskRule = <T extends { examples: string[] }>(rule: T): T => ({
    ...rule,
    examples: rule.examples.map(maskText),
  });
  // 실명을 키로 삼은 카테고리 규칙(contains '박말순' 등)의 키도 가린다
  const maskMatch = (match: CategoryRule['match']): CategoryRule['match'] => {
    switch (match.kind) {
      case 'exact':
        return { kind: 'exact', key: maskText(match.key) };
      case 'contains':
        return { kind: 'contains', text: maskText(match.text) };
      case 'regex':
        return { kind: 'regex', pattern: maskText(match.pattern) };
    }
  };

  return {
    ...rules,
    aliases: Object.fromEntries(
      Object.entries(rules.aliases).map(([real, alias]) => [label.get(real)!, alias])
    ),
    insiders: rules.insiders.map((name) => label.get(name) ?? '<실명>'),
    categoryRules: rules.categoryRules.map((r) => ({ ...maskRule(r), match: maskMatch(r.match) })),
    ignore: rules.ignore.map((r) => ({ ...maskRule(r), pattern: maskText(r.pattern) })),
    transfer: rules.transfer.map((r) => ({ ...maskRule(r), pattern: maskText(r.pattern) })),
    decisions: rules.decisions.map((d) => ({
      ...d,
      key: maskText(d.key),
      sample: maskText(d.sample),
    })),
  };
}

export function registerResources(server: McpServer, deps: ToolDeps) {
  server.registerResource(
    'categories',
    CATEGORIES_URI,
    {
      title: '가계부 카테고리 목록',
      description:
        '로그인 커플의 카테고리. LLM이 카테고리를 고를 때의 유일한 후보 목록 — name 중에서만 고른다.',
      mimeType: 'application/json',
    },
    async (uri) => {
      const session = await deps.session.require();
      const categories = await deps.categories.get(session);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(categories, null, 2),
          },
        ],
      };
    }
  );

  server.registerResource(
    'rules',
    RULES_URI,
    {
      title: '결산 규칙 (로컬)',
      description:
        '사용자가 세운 기준(principles), 적요→카테고리 규칙, 무시 패턴, 송금 패턴, 실명→별칭, 우리(insiders), 결정 로그. 과거에 어떻게 분류했는지 참고한다. 사용자 PC에만 있는 파일이다.',
      mimeType: 'application/json',
    },
    async (uri) => {
      const session = await deps.session.require();
      const rules = await loadSessionRules(deps, session);
      const body = deps.exposeAliasesInResource ? rules.file : maskAliases(rules.file);
      return {
        contents: [
          { uri: uri.href, mimeType: 'application/json', text: JSON.stringify(body, null, 2) },
        ],
      };
    }
  );

  server.registerResource(
    'principles',
    PRINCIPLES_URI,
    {
      title: '결산할 때 지키는 여섯 가지',
      description:
        '서버가 지키는 결산 원칙. 사용자와 LLM이 같은 글을 읽는다. 결산 시작 때 굵은 제목 여섯 줄만 보여 주고, 판단을 설명할 때 "원칙 N(제목)"으로 인용한다. 사용자가 바꿀 수 없다.',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [
        { uri: uri.href, mimeType: 'text/markdown', text: await readPrinciplesMarkdown() },
      ],
    })
  );

  server.registerResource(
    'interview',
    INTERVIEW_URI,
    {
      title: '첫 결산 인터뷰',
      description:
        '규칙 파일의 interview.completedAt이 null일 때, 내역서를 읽기 전에 묻는 네 질문. 질문과 선택지를 그대로 보여 주고(말을 바꾸지 않는다) 답은 save_rule { kind:"interview" }로 저장한다.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ questions: INTERVIEW_QUESTIONS }, null, 2),
        },
      ],
    })
  );
}
