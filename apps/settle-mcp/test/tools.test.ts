import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { normalize } from '../src/core/fingerprint';
import type { RulesFile } from '../src/core/rules';
import type { StagedTransaction } from '../src/core/types';
import { undoBatch } from '../src/tools/undo-batch';
import type { CommitBatchOutput } from '../src/tools/commit-batch';
import type { ListStagedOutput } from '../src/tools/list-staged';
import type { SaveRuleOutput } from '../src/tools/save-rule';
import type { SetCategoryOutput } from '../src/tools/set-category';
import type { StageOutput } from '../src/tools/stage-transactions';
import type { UndoBatchOutput } from '../src/tools/undo-batch';
import { createHarness, expectToolError, tx, UID, type Harness } from './helpers';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
});
afterEach(async () => {
  await h.close();
});

const stage = (
  transactions: ReturnType<typeof tx>[],
  over: { kind?: 'account' | 'card'; label?: string } = {}
) =>
  h.call<StageOutput>('stage_transactions', {
    label: over.label ?? '2026-09 테스트',
    source: { kind: over.kind ?? 'account', name: 'KB' },
    transactions,
  });

describe('연결 상태', () => {
  it('로그인되어 있지 않으면 모든 도구가 NOT_CONNECTED', async () => {
    h.session.connected = false;
    const err = await expectToolError(h, 'list_staged', { batchId: 'x' });
    expect(err.code).toBe('NOT_CONNECTED');
    const err2 = await expectToolError(h, 'stage_transactions', {
      label: 'x',
      source: { kind: 'card' },
      transactions: [tx()],
    });
    expect(err2.code).toBe('NOT_CONNECTED');
  });
});

describe('stage_transactions', () => {
  it('규칙 적용·배치 내 중복·기존 내역 대조를 한 번에 하고 Firestore는 건드리지 않는다', async () => {
    const dup = h.gateway.seed({ date: '2026-09-05', amount: 12000 });
    const out = await stage([
      tx({ date: '2026-09-05', amount: 12000, description: '이마트' }), // 기존과 중복
      tx({ description: '스타벅스코리아' }),
      tx({ description: '스타벅스코리아' }), // 배치 내 중복 → drop
      tx({ description: '스타벅스코리아', amount: 5001, category: null }), // 카테고리 없음
      tx({ description: '홍길동 이체', amount: 50000, category: '기타' }), // 송금
      tx({ description: '신한카드 대금', amount: 300000, category: '기타' }), // 카드대금 무시
      tx({ type: 'income', description: '급여', amount: 3000000, category: '급여' }),
    ]);

    expect(out.summary).toEqual({
      pending: 3,
      duplicate: 1,
      transfer: 1,
      ignored: 1,
      droppedInBatch: 1,
      missingCategory: 1,
    });
    expect(out.droppedInBatch).toEqual([
      { date: '2026-09-10', amount: 5000, description: '스타벅스코리아' },
    ]);
    const attention = out.needsAttention.map((r) => [r.rawDescription, r.status]);
    expect(attention).toEqual(
      expect.arrayContaining([
        ['이마트', 'duplicate'],
        ['스타벅스코리아', 'pending'],
        ['홍길동 이체', 'transfer'],
      ])
    );
    expect(out.needsAttention).toHaveLength(3);
    expect(out.needsAttention.find((r) => r.status === 'duplicate')!.duplicateOf).toBe(dup);
    // 아직 아무것도 쓰지 않았다
    expect(h.gateway.entries.size).toBe(1);
  });

  it('LLM 후보가 카테고리 목록에 없으면 null로 바꾸고 정확일치 규칙은 LLM 후보를 덮는다', async () => {
    await h.call('save_rule', {
      rule: { kind: 'exactCategory', description: '넷플릭스', category: '구독' },
    });
    const out = await stage([
      tx({ description: '넷플릭스', category: '식비' }),
      tx({ description: '쿠팡', amount: 100, category: '쇼핑' }),
    ]);
    const list = await h.call<ListStagedOutput>('list_staged', { batchId: out.batchId });
    const byDesc = Object.fromEntries(list.items.map((r) => [r.rawDescription, r]));
    expect(byDesc['넷플릭스']!.category).toBe('구독');
    expect(byDesc['넷플릭스']!.categorySource).toBe('rule');
    expect(byDesc['쿠팡']!.category).toBeNull();
  });

  it('입력 검증 — 음수 금액, 잘못된 날짜, 빈 배열은 거절', async () => {
    const bad = await h.callRaw('stage_transactions', {
      label: 'x',
      source: { kind: 'card' },
      transactions: [tx({ amount: -1 })],
    });
    expect(bad.isError).toBe(true);
    const badDate = await h.callRaw('stage_transactions', {
      label: 'x',
      source: { kind: 'card' },
      transactions: [tx({ date: '2026-13-40' })],
    });
    expect(badDate.isError).toBe(true);
  });
});

describe('set_category', () => {
  it('목록 밖 카테고리·무시 행·커밋된 배치는 거절하고, 중복→pending은 경고와 함께 허용', async () => {
    h.gateway.seed({ date: '2026-09-10', amount: 5000 });
    const out = await stage([
      tx({ description: '스타벅스코리아' }), // duplicate
      tx({ description: '신한카드 대금', amount: 1 }), // ignored
      tx({ description: '이디야', amount: 2, category: null }),
    ]);
    const list = await h.call<ListStagedOutput>('list_staged', { batchId: out.batchId });
    const id = (d: string) => list.items.find((r) => r.rawDescription === d)!.id;

    const res = await h.call<SetCategoryOutput>('set_category', {
      batchId: out.batchId,
      changes: [
        { id: id('스타벅스코리아'), status: 'pending' },
        { id: id('신한카드 대금'), category: '식비' },
        { id: id('이디야'), category: '없는것' },
        { id: 'ghost', category: '식비' },
      ],
    });
    expect(res.updated).toBe(1);
    expect(res.warnings).toHaveLength(1);
    expect(res.rejected.map((r) => r.code)).toEqual([
      'IGNORED_LOCKED',
      'UNKNOWN_CATEGORY',
      'NOT_FOUND',
    ]);

    await h.call('set_category', {
      batchId: out.batchId,
      changes: [{ id: id('이디야'), category: '식비' }],
    });
    const after = await h.call<ListStagedOutput>('list_staged', {
      batchId: out.batchId,
      status: ['pending'],
    });
    expect(after.items.map((r) => r.rawDescription).sort()).toEqual(['스타벅스코리아', '이디야']);
    expect(after.items.find((r) => r.rawDescription === '이디야')!.categorySource).toBe('user');

    await h.call('commit_batch', { batchId: out.batchId });
    const locked = await expectToolError(h, 'set_category', {
      batchId: out.batchId,
      changes: [{ id: id('이디야'), category: '기타' }],
    });
    expect(locked.code).toBe('BATCH_ALREADY_COMMITTED');
  });
});

describe('save_rule', () => {
  it('파일에 원자적으로 쓰고, 너무 넓은 패턴은 거절한다', async () => {
    const out = await h.call<SaveRuleOutput>('save_rule', {
      rule: { kind: 'alias', realName: '홍길동', alias: '처형' },
    });
    expect(out.rules.aliases).toEqual({ 홍길동: '처형' });
    const onDisk = JSON.parse(await readFile(h.deps.rulesPath, 'utf8')) as RulesFile;
    expect(onDisk.aliases).toEqual({ 홍길동: '처형' });
    expect(onDisk.coupleId).toBe('couple-1');

    const broad = await expectToolError(h, 'save_rule', {
      rule: { kind: 'ignore', pattern: 'x*', reason: 'r' },
    });
    expect(broad.code).toBe('PATTERN_TOO_BROAD');
    const unknown = await expectToolError(h, 'save_rule', {
      rule: { kind: 'exactCategory', description: '넷플릭스', category: '없음' },
    });
    expect(unknown.code).toBe('UNKNOWN_CATEGORY');
  });

  it('커밋 전 배치에 다시 적용하되 사용자가 바꾼 카테고리는 보존한다', async () => {
    const out = await stage([
      tx({ description: '넷플릭스', amount: 17000, category: '식비' }),
      tx({ description: '넷플릭스', amount: 17001, category: '식비' }),
      tx({ description: '홍길동', amount: 10, category: '기타' }),
    ]);
    const list = await h.call<ListStagedOutput>('list_staged', { batchId: out.batchId });
    const userRow = list.items.find((r) => r.amount === 17001)!;
    await h.call('set_category', {
      batchId: out.batchId,
      changes: [{ id: userRow.id, category: '기타' }],
    });

    const r1 = await h.call<SaveRuleOutput>('save_rule', {
      rule: { kind: 'exactCategory', description: '넷플릭스', category: '구독' },
    });
    expect(r1.appliedToBatch).toEqual({ batchId: out.batchId, changed: 1 });
    const r2 = await h.call<SaveRuleOutput>('save_rule', {
      rule: { kind: 'alias', realName: '홍길동', alias: '처형' },
    });
    expect(r2.appliedToBatch!.changed).toBe(1);

    const after = await h.call<ListStagedOutput>('list_staged', { batchId: out.batchId });
    const byAmount = Object.fromEntries(after.items.map((r) => [r.amount, r]));
    expect(byAmount[17000]!.category).toBe('구독');
    expect(byAmount[17000]!.categorySource).toBe('rule');
    expect(byAmount[17001]!.category).toBe('기타');
    expect(byAmount[17001]!.categorySource).toBe('user');
    expect(byAmount[10]!.description).toBe('처형');
    expect(byAmount[10]!.rawDescription).toBe('홍길동');
  });

  it('사용자가 pending으로 바꾼 송금 행은 규칙 재적용 후에도 pending이다', async () => {
    const out = await stage([tx({ description: '홍길동 이체', amount: 50000, category: '기타' })]);
    const list = await h.call<ListStagedOutput>('list_staged', { batchId: out.batchId });
    const row = list.items[0]!;
    expect(row.status).toBe('transfer');
    await h.call('set_category', {
      batchId: out.batchId,
      changes: [{ id: row.id, status: 'pending' }],
    });

    await h.call('save_rule', { rule: { kind: 'alias', realName: '홍길동', alias: '처형' } });
    const after = await h.call<ListStagedOutput>('list_staged', { batchId: out.batchId });
    expect(after.items[0]).toMatchObject({ status: 'pending', description: '처형 이체' });

    const commit = await h.call<CommitBatchOutput>('commit_batch', { batchId: out.batchId });
    expect(commit.committed).toBe(1);
    expect([...h.gateway.entries.values()][0]!.description).toBe('처형 이체');
  });

  it('remove로 규칙을 지울 수 있다', async () => {
    await h.call('save_rule', {
      rule: { kind: 'exactCategory', description: '넷플릭스', category: '구독' },
    });
    const out = await h.call<SaveRuleOutput>('save_rule', {
      rule: { kind: 'remove', target: 'exactCategory', key: '넷플릭스' },
    });
    expect(out.rules.exactCategory[normalize('넷플릭스')]).toBeUndefined();
  });
});

describe('commit_batch', () => {
  it('dryRun은 쓰지 않고, 실제 커밋은 pending만 치환된 적요로 쓴다', async () => {
    await h.call('save_rule', { rule: { kind: 'alias', realName: '홍길동', alias: '처형' } });
    const out = await stage([
      tx({ description: '스타벅스코리아' }),
      tx({ description: '홍길동 송금', amount: 50000, category: '기타' }), // 송금 → 제외
      tx({ description: '신한카드 대금', amount: 1, category: '기타' }), // 무시
    ]);
    const list = await h.call<ListStagedOutput>('list_staged', { batchId: out.batchId });
    const transfer = list.items.find((r) => r.status === 'transfer')!;
    await h.call('set_category', {
      batchId: out.batchId,
      changes: [{ id: transfer.id, status: 'pending' }],
    });

    const dry = await h.call<CommitBatchOutput>('commit_batch', {
      batchId: out.batchId,
      dryRun: true,
    });
    expect(dry).toMatchObject({
      committed: 0,
      wouldCommit: 2,
      skipped: { duplicate: 0, transfer: 0, ignored: 1 },
    });
    expect(h.gateway.addCalls).toBe(0);

    const real = await h.call<CommitBatchOutput>('commit_batch', { batchId: out.batchId });
    expect(real.committed).toBe(2);
    expect(real.entryIds).toHaveLength(2);
    const written = [...h.gateway.entries.values()];
    expect(written.map((e) => e.description).sort()).toEqual(['스타벅스코리아', '처형 송금']);
    expect(written.every((e) => e.createdBy === UID)).toBe(true);

    const after = await h.call<ListStagedOutput>('list_staged', {
      batchId: out.batchId,
      status: ['committed'],
    });
    expect(after.items.map((r) => r.committedEntryId).sort()).toEqual([...real.entryIds].sort());
    expect(after.batch.status).toBe('committed');

    const again = await expectToolError(h, 'commit_batch', { batchId: out.batchId });
    expect(again.code).toBe('BATCH_ALREADY_COMMITTED');
  });

  it('카테고리가 없는 행이 있으면 한 건도 쓰지 않는다 (COMMIT_BLOCKED)', async () => {
    const out = await stage([tx(), tx({ amount: 1, category: null })]);
    const err = await expectToolError(h, 'commit_batch', { batchId: out.batchId });
    expect(err.code).toBe('COMMIT_BLOCKED');
    expect((err.details as CommitBatchOutput).blocked.map((b) => b.code)).toEqual([
      'MISSING_CATEGORY',
    ]);
    expect(h.gateway.entries.size).toBe(0);
  });

  it('스테이징 이후 앱에서 같은 내역이 들어오면 재대조로 빼고 나머지는 쓴다', async () => {
    const out = await stage([tx(), tx({ amount: 9000 })]);
    h.gateway.seed({ date: '2026-09-10', amount: 5000 });
    const res = await h.call<CommitBatchOutput>('commit_batch', { batchId: out.batchId });
    expect(res.committed).toBe(1);
    expect(res.skipped.duplicate).toBe(1);
    const dup = await h.call<ListStagedOutput>('list_staged', {
      batchId: out.batchId,
      status: ['duplicate'],
    });
    expect(dup.items[0]!.amount).toBe(5000);
  });

  it('쓰기에 실패하면 아무것도 기록되지 않고 배치는 staging으로 남는다', async () => {
    const many = Array.from({ length: 500 }, (_, i) => tx({ amount: 1000 + i }));
    const out = await stage(many, { kind: 'card' });
    h.gateway.failNextAddAfterChunks = 0;
    const err = await expectToolError(h, 'commit_batch', { batchId: out.batchId });
    expect(err.code).toBe('FIRESTORE_WRITE_FAILED');
    expect(h.gateway.entries.size).toBe(0);
    const list = await h.call<ListStagedOutput>('list_staged', { batchId: out.batchId, limit: 1 });
    expect(list.batch.status).toBe('staging');
  });

  it('pending이 하나도 없으면 NOTHING_TO_COMMIT', async () => {
    const out = await stage([tx({ description: '신한카드 대금' })]);
    const err = await expectToolError(h, 'commit_batch', { batchId: out.batchId });
    expect(err.code).toBe('NOTHING_TO_COMMIT');
  });
});

describe('undo_batch', () => {
  it('배치가 쓴 문서만 지우고, 남의 문서·이미 지운 문서는 건너뛰며, 행은 pending으로 돌아간다', async () => {
    const foreign = h.gateway.seed({ date: '2026-09-01', amount: 1 });
    const out = await stage([tx(), tx({ amount: 6000 }), tx({ amount: 7000 })]);
    const res = await h.call<CommitBatchOutput>('commit_batch', { batchId: out.batchId });
    // 하나는 앱에서 이미 지웠고, 하나는 파트너가 소유권을 바꾼 상황을 흉내
    h.gateway.entries.delete(res.entryIds[0]!);
    h.gateway.entries.get(res.entryIds[1]!)!.createdBy = 'someone-else';

    const undo = await h.call<UndoBatchOutput>('undo_batch', { batchId: out.batchId });
    expect(undo).toEqual({
      batchId: out.batchId,
      deleted: 1,
      notFound: [res.entryIds[0]],
      skippedForeign: [res.entryIds[1]],
    });
    expect(h.gateway.entries.has(foreign)).toBe(true);
    const list = await h.call<ListStagedOutput>('list_staged', { batchId: out.batchId });
    expect(list.batch.status).toBe('undone');
    expect(
      list.items.every(
        (r: StagedTransaction) => r.status === 'pending' && r.committedEntryId === null
      )
    ).toBe(true);

    const notCommitted = await expectToolError(h, 'undo_batch', { batchId: out.batchId });
    expect(notCommitted.code).toBe('BATCH_NOT_COMMITTED');
  });

  it('커밋 후 30일이 지나면 UNDO_EXPIRED', async () => {
    const out = await stage([tx()]);
    await h.call('commit_batch', { batchId: out.batchId });
    const later = Date.now() + 31 * 24 * 60 * 60 * 1000;
    await expect(undoBatch(h.deps, { batchId: out.batchId }, () => later)).rejects.toMatchObject({
      code: 'UNDO_EXPIRED',
    });
    expect(h.gateway.entries.size).toBe(1);
  });
});

describe('리소스·프롬프트', () => {
  it('categories 리소스는 카테고리 name 목록을, rules 리소스는 규칙 파일을 돌려준다', async () => {
    await h.call('save_rule', { rule: { kind: 'alias', realName: '홍길동', alias: '처형' } });
    const cats = await h.client.readResource({ uri: 'uandi://categories' });
    const names = (
      JSON.parse((cats.contents[0] as { text: string }).text) as { name: string }[]
    ).map((c) => c.name);
    expect(names).toEqual(['식비', '구독', '기타', '급여']);

    const rules = await h.client.readResource({ uri: 'uandi://rules' });
    expect((JSON.parse((rules.contents[0] as { text: string }).text) as RulesFile).aliases).toEqual(
      { 홍길동: '처형' }
    );
  });

  it('exposeAliasesInResource=false면 실명 키를 가린다', async () => {
    await h.close();
    h = await createHarness({ exposeAliases: false });
    await h.call('save_rule', { rule: { kind: 'alias', realName: '홍길동', alias: '처형' } });
    const rules = await h.client.readResource({ uri: 'uandi://rules' });
    expect((JSON.parse((rules.contents[0] as { text: string }).text) as RulesFile).aliases).toEqual(
      { '<실명 1>': '처형' }
    );
  });

  it('settle-statement 프롬프트는 월과 내역서 종류를 반영한다', async () => {
    const p = await h.client.getPrompt({
      name: 'settle-statement',
      arguments: { month: '2026-09', sourceKind: 'card' },
    });
    const text = (p.messages[0]!.content as { text: string }).text;
    expect(text).toContain('2026-09');
    expect(text).toContain('카드 내역서');
    expect(text).toContain('stage_transactions');
  });
});
