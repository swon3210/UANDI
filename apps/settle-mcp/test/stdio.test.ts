import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * 실제 CLI 엔트리를 stdio로 띄워 호스트(Claude Desktop)가 보는 그대로 확인한다.
 * 로그인은 하지 않는다 — 도구 목록·리소스·프롬프트가 등록됐는지와 NOT_CONNECTED 응답까지.
 */
describe('stdio 서버', () => {
  let dir: string;
  let client: Client;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'settle-stdio-'));
    const transport = new StdioClientTransport({
      command: join(process.cwd(), 'node_modules/.bin/tsx'),
      args: ['src/cli.ts', 'serve'],
      cwd: process.cwd(),
      // 이 PC의 실제 로그인(키체인 'uandi-settle')과 섞이지 않게 서비스 이름을 분리한다
      env: {
        ...process.env,
        UANDI_SETTLE_DIR: dir,
        UANDI_SETTLE_KEYRING_SERVICE: `uandi-settle-test-${process.pid}`,
      } as Record<string, string>,
      stderr: 'pipe',
    });
    client = new Client({ name: 'stdio-test', version: '0' });
    await client.connect(transport);
  }, 30_000);

  afterAll(async () => {
    await client.close();
    await rm(dir, { recursive: true, force: true });
  });

  it('도구 6개·리소스 4개·프롬프트 1개가 등록된다', async () => {
    const tools = (await client.listTools()).tools.map((t) => t.name).sort();
    expect(tools).toEqual(
      [
        'commit_batch',
        'list_staged',
        'save_rule',
        'set_category',
        'stage_transactions',
        'undo_batch',
      ].sort()
    );
    const resources = (await client.listResources()).resources.map((r) => r.uri).sort();
    expect(resources).toEqual([
      'uandi://categories',
      'uandi://interview',
      'uandi://principles',
      'uandi://rules',
    ]);
    const prompts = (await client.listPrompts()).prompts.map((p) => p.name);
    expect(prompts).toEqual(['settle-statement']);
  });

  it('연결 전에는 NOT_CONNECTED와 연결 페이지 안내를 돌려준다', async () => {
    const res = await client.callTool({ name: 'list_staged', arguments: { batchId: 'x' } });
    expect(res.isError).toBe(true);
    const body = JSON.parse((res.content as { text: string }[])[0]!.text) as {
      code: string;
      details: { connectPage: string };
    };
    expect(body.code).toBe('NOT_CONNECTED');
    expect(body.details.connectPage).toMatch(/\/settings\/desktop$/);
  });
});
