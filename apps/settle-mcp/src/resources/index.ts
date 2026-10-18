import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RulesFile } from '../core/rules';
import { loadSessionRules, type ToolDeps } from '../tools/shared';

export const CATEGORIES_URI = 'uandi://categories';
export const RULES_URI = 'uandi://rules';

/** 실명(aliases 키)을 가린 규칙 — LLM 제공자에게 실명을 보내고 싶지 않은 사용자용 (§6.1) */
export function maskAliases(rules: RulesFile): RulesFile {
  const masked: Record<string, string> = {};
  Object.values(rules.aliases).forEach((alias, i) => {
    masked[`<실명 ${i + 1}>`] = alias;
  });
  return { ...rules, aliases: masked };
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
        '적요→카테고리 정확일치, 무시 패턴, 송금 패턴, 실명→별칭. 과거에 어떻게 분류했는지 참고한다. 사용자 PC에만 있는 파일이다.',
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
}
