import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SettleError } from '../src/core/errors';
import type { CategorySummary, ExistingEntry } from '../src/core/types';
import type { CashbookGateway, NewEntry } from '../src/firebase/gateway';
import type { Session, SessionProvider } from '../src/firebase/session';
import { createServer } from '../src/server';
import { JsonFileStore } from '../src/store/json-store';
import { CategoryCache, type ToolDeps } from '../src/tools/shared';

export const UID = 'uid-me';
export const PARTNER_UID = 'uid-partner';
export const COUPLE_ID = 'couple-1';

export const CATEGORIES: CategorySummary[] = [
  {
    name: '식비',
    group: 'expense',
    subGroup: 'variable_common',
    parent: null,
    description: '',
    examples: ['스타벅스'],
  },
  {
    name: '구독',
    group: 'expense',
    subGroup: 'fixed_expense',
    parent: null,
    description: '',
    examples: [],
  },
  {
    name: '기타',
    group: 'expense',
    subGroup: 'variable_common',
    parent: null,
    description: '',
    examples: [],
  },
  {
    name: '급여',
    group: 'income',
    subGroup: 'regular_income',
    parent: null,
    description: '',
    examples: [],
  },
];

export type FakeEntry = NewEntry & { id: string; createdBy: string };

/** 메모리 Firestore 흉내. 테스트가 기존 내역을 심고, 쓰기 실패를 주입한다 */
export class FakeGateway implements CashbookGateway {
  entries = new Map<string, FakeEntry>();
  categories: CategorySummary[] = CATEGORIES;
  failNextAddAfterChunks: number | null = null;
  addCalls = 0;
  private seq = 0;

  seed(e: { date: string; amount: number; createdBy?: string; description?: string }): string {
    const id = `seed-${++this.seq}`;
    this.entries.set(id, {
      id,
      date: e.date,
      amount: e.amount,
      type: 'expense',
      category: '기타',
      description: e.description ?? 'seed',
      createdBy: e.createdBy ?? PARTNER_UID,
    });
    return id;
  }

  async getExistingEntries(start: string, end: string): Promise<ExistingEntry[]> {
    return [...this.entries.values()]
      .filter((e) => e.date >= start && e.date <= end)
      .map((e) => ({ id: e.id, date: e.date, amount: e.amount }));
  }

  async getCategories() {
    return this.categories;
  }

  async addEntries(entries: NewEntry[]): Promise<string[]> {
    this.addCalls += 1;
    if (this.failNextAddAfterChunks !== null && this.addCalls > this.failNextAddAfterChunks) {
      throw new Error('firestore down');
    }
    return entries.map((e) => {
      const id = `new-${++this.seq}`;
      this.entries.set(id, { ...e, id, createdBy: UID });
      return id;
    });
  }

  async getEntryCreator(entryId: string) {
    return this.entries.get(entryId)?.createdBy ?? null;
  }

  async deleteEntry(entryId: string) {
    this.entries.delete(entryId);
  }
}

export class FakeSession implements SessionProvider {
  connected = true;
  constructor(readonly gateway: FakeGateway) {}
  private session(): Session {
    return { uid: UID, coupleId: COUPLE_ID, gateway: this.gateway };
  }
  async require(): Promise<Session> {
    if (!this.connected) throw new SettleError('NOT_CONNECTED', '연결되지 않음');
    return this.session();
  }
  async current() {
    return this.connected ? { uid: UID, coupleId: COUPLE_ID } : null;
  }
}

export type Harness = {
  dir: string;
  deps: ToolDeps;
  gateway: FakeGateway;
  session: FakeSession;
  client: Client;
  call<T = unknown>(name: string, args: Record<string, unknown>): Promise<T>;
  callRaw(name: string, args: Record<string, unknown>): Promise<CallToolResult>;
  close(): Promise<void>;
};

/** 도구 결과의 ```json 블록을 꺼낸다 */
export function parseResult<T>(result: CallToolResult): T {
  const text = (result.content[0] as { text: string }).text;
  const m = text.match(/```json\n([\s\S]*?)\n```/);
  return JSON.parse(m ? m[1]! : text) as T;
}

export type ToolErrorBody = { code: string; message: string; details?: unknown };

export async function createHarness(opts: { exposeAliases?: boolean } = {}): Promise<Harness> {
  const dir = await mkdtemp(join(tmpdir(), 'settle-mcp-'));
  const gateway = new FakeGateway();
  const session = new FakeSession(gateway);
  const deps: ToolDeps = {
    store: new JsonFileStore(join(dir, 'staged.json')),
    rulesPath: join(dir, 'rules.json'),
    session,
    categories: new CategoryCache(),
    exposeAliasesInResource: opts.exposeAliases ?? true,
  };
  const server = createServer(deps);
  const client = new Client({ name: 'test', version: '0' });
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  await server.connect(serverT);
  await client.connect(clientT);

  const callRaw = (name: string, args: Record<string, unknown>) =>
    client.callTool({ name, arguments: args }) as Promise<CallToolResult>;

  return {
    dir,
    deps,
    gateway,
    session,
    client,
    callRaw,
    async call<T>(name: string, args: Record<string, unknown>) {
      const res = await callRaw(name, args);
      if (res.isError) {
        throw new Error(`tool ${name} failed: ${(res.content[0] as { text: string }).text}`);
      }
      return parseResult<T>(res);
    },
    async close() {
      await client.close();
      await server.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}

export async function expectToolError(
  h: Harness,
  name: string,
  args: Record<string, unknown>
): Promise<ToolErrorBody> {
  const res = await h.callRaw(name, args);
  if (!res.isError) throw new Error(`expected ${name} to fail`);
  return JSON.parse((res.content[0] as { text: string }).text) as ToolErrorBody;
}

export const tx = (
  over: Partial<{
    date: string;
    amount: number;
    type: 'income' | 'expense';
    description: string;
    category: string | null;
    sourceHint: string;
  }> = {}
) => ({
  date: '2026-09-10',
  amount: 5000,
  type: 'expense' as const,
  description: '스타벅스코리아',
  category: '식비',
  ...over,
});
