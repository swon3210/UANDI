import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SettleError } from '../core/errors';
import { loadRules, type CompiledRules } from '../core/rules';
import type { CategorySummary } from '../core/types';
import type { Session, SessionProvider } from '../firebase/session';
import type { Store } from '../store/json-store';

export type ToolDeps = {
  store: Store;
  rulesPath: string;
  session: SessionProvider;
  categories: CategoryCache;
  exposeAliasesInResource: boolean;
};

const CATEGORY_TTL_MS = 5 * 60 * 1000;

/** 카테고리 목록 5분 캐시 (§6.1). 커플별로 한 벌 */
export class CategoryCache {
  private cache = new Map<string, { at: number; list: CategorySummary[] }>();

  constructor(private readonly now: () => number = Date.now) {}

  async get(session: Session): Promise<CategorySummary[]> {
    const hit = this.cache.get(session.coupleId);
    if (hit && this.now() - hit.at < CATEGORY_TTL_MS) return hit.list;
    let list: CategorySummary[];
    try {
      list = await session.gateway.getCategories();
    } catch (e) {
      throw new SettleError('FIRESTORE_READ_FAILED', '카테고리 목록을 읽지 못했습니다', {
        cause: (e as Error).message,
      });
    }
    this.cache.set(session.coupleId, { at: this.now(), list });
    return list;
  }

  async names(session: Session): Promise<Set<string>> {
    return new Set((await this.get(session)).map((c) => c.name));
  }

  invalidate(): void {
    this.cache.clear();
  }
}

export async function loadSessionRules(deps: ToolDeps, session: Session): Promise<CompiledRules> {
  return loadRules(deps.rulesPath, session.coupleId);
}

/** 요약 한 줄 + 구조화 JSON. LLM이 사용자에게 표로 보여주기 좋게 */
export function toolResult(summary: string, data: unknown): CallToolResult {
  return {
    content: [
      { type: 'text', text: `${summary}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`` },
    ],
  };
}

export function toolError(error: unknown): CallToolResult {
  const payload =
    error instanceof SettleError
      ? error.toJSON()
      : { code: 'INTERNAL', message: error instanceof Error ? error.message : String(error) };
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }], isError: true };
}

/** 핸들러의 SettleError를 isError 결과로 바꾼다 */
export function guarded<Args>(
  handler: (args: Args) => Promise<CallToolResult>
): (args: Args) => Promise<CallToolResult> {
  return async (args) => {
    try {
      return await handler(args);
    } catch (e) {
      return toolError(e);
    }
  };
}
