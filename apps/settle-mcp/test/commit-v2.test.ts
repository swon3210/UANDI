import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { recordDecision } from '../src/core/decisions';
import { normalize } from '../src/core/fingerprint';
import { buildRetrospective, machineRuleCount } from '../src/core/retrospective';
import { defaultRules } from '../src/core/rules';
import type { StagedTransaction } from '../src/core/types';
import type { CommitBatchOutput } from '../src/tools/commit-batch';
import type { ListStagedOutput } from '../src/tools/list-staged';
import type { StageOutput } from '../src/tools/stage-transactions';
import { createHarness, expectToolError, tx, type Harness, type ToolErrorBody } from './helpers';
import { containsRule, rulesWith } from './rule-factories';

const NOW = '2026-10-01T00:00:00.000Z';
const row = (over: Partial<StagedTransaction> & { id: string }): StagedTransaction => ({
  batchId: 'b',
  fingerprint: 'f',
  date: '2026-09-10',
  amount: 5000,
  type: 'expense',
  rawDescription: '스타벅스',
  description: '스타벅스',
  category: '식비',
  categorySource: 'llm',
  appliedRuleId: null,
  suggestionIds: [],
  status: 'pending',
  statusReason: null,
  duplicateOf: null,
  sourceHint: null,
  committedEntryId: null,
  createdAt: NOW,
  ...over,
});

describe('buildRetrospective (core)', () => {
  it('출처별 건수·손으로 고친 수·새 규칙 수·승격 후보·규칙 없는 큰 금액·건드린 원칙을 모은다', () => {
    const conflicting = containsRule('카드대금', '기타', { conflictsWith: [2] });
    let file = rulesWith({ categoryRules: [conflicting] });
    file = recordDecision(
      file,
      { rawDescription: '이디야', category: '식비', batchId: 'b0' },
      NOW
    ).file;
    file = recordDecision(
      file,
      { rawDescription: '이디야', category: '식비', batchId: 'b0' },
      NOW
    ).file;
    // 기계 규칙 3개(기본 2 + 1). 배치 시작 때는 2개였다고 치면 새 규칙 1개
    expect(machineRuleCount(file)).toBe(3);

    const committable = [
      row({
        id: 'a',
        amount: 800000,
        rawDescription: '월세',
        description: '월세',
        category: '기타',
      }),
      row({
        id: 'b',
        amount: 17000,
        category: '기타',
        categorySource: 'rule',
        appliedRuleId: conflicting.id,
      }),
      row({
        id: 'c',
        amount: 4000,
        rawDescription: '이디야',
        description: '이디야',
        categorySource: 'user',
      }),
      row({ id: 'd', amount: 3000, categorySource: 'llm' }),
      row({ id: 'e', amount: 2000, categorySource: 'llm' }),
      row({ id: 'f', amount: 1000, categorySource: 'llm' }),
      row({ id: 'g', amount: 500, categorySource: 'llm' }),
    ];
    const rows = [
      ...committable,
      row({ id: 'x', status: 'ignored', category: null, categorySource: null }),
      row({ id: 'y', status: 'transfer' }),
    ];
    const r = buildRetrospective({ rows, committable, file, rulesAtStart: 2 });
    expect(r.byCategorySource).toEqual({ rule: 1, llm: 5, user: 1 });
    expect(r.userOverrides).toBe(1);
    expect(r.rulesSavedDuringBatch).toBe(1);
    expect(r.promotable).toEqual([
      expect.objectContaining({
        kind: 'promote',
        key: normalize('이디야'),
        category: '식비',
        count: 2,
        rowIds: ['c'],
      }),
    ]);
    // 규칙(b) 제외, 금액 큰 순 5건
    expect(r.unruledTop.map((u) => u.rowId)).toEqual(['a', 'c', 'd', 'e', 'f']);
    expect(r.unruledTop[0]).toEqual({
      rowId: 'a',
      description: '월세',
      amount: 800000,
      category: '기타',
    });
    // 무시 행 → 2, 송금 보류 → 3, 적용 규칙의 conflictsWith → 2
    expect(r.principlesTouched).toEqual([2, 3]);
  });

  it('v2 이전 배치(rulesAtStart null)는 새 규칙 수를 0으로, 규칙이 줄어도 음수가 되지 않는다', () => {
    const file = defaultRules('c1', NOW);
    const base = { rows: [], committable: [], file };
    expect(buildRetrospective({ ...base, rulesAtStart: null }).rulesSavedDuringBatch).toBe(0);
    expect(buildRetrospective({ ...base, rulesAtStart: 5 }).rulesSavedDuringBatch).toBe(0);
    expect(buildRetrospective({ ...base, rulesAtStart: 0 }).rulesSavedDuringBatch).toBe(2);
    expect(buildRetrospective({ ...base, rulesAtStart: 0 }).principlesTouched).toEqual([]);
  });
});

describe('commit_batch 회고 (도구)', () => {
  let h: Harness;
  beforeEach(async () => {
    h = await createHarness();
  });
  afterEach(async () => {
    await h.close();
  });
  const stage = (transactions: ReturnType<typeof tx>[], label = '2026-09 KB') =>
    h.call<StageOutput>('stage_transactions', {
      label,
      source: { kind: 'account', name: 'KB' },
      transactions,
    });

  it('dryRun과 실커밋이 같은 회고를 돌려주고, 배치 중 저장한 규칙이 rulesSavedDuringBatch에 잡힌다', async () => {
    const out = await stage([
      tx({ description: '월세', amount: 800000, category: '기타' }),
      tx({ description: '넷플릭스', amount: 17000, category: '식비' }),
      tx({ description: '이디야', amount: 4000, category: null }),
      tx({ description: '홍길동 이체', amount: 50000, category: null }),
      tx({ description: '신한카드 대금', amount: 900000, category: null }),
    ]);
    const rows = (await h.call<ListStagedOutput>('list_staged', { batchId: out.batchId })).items;
    const idOf = (amount: number) => rows.find((r) => r.amount === amount)!.id;

    await h.call('save_rule', {
      rule: { kind: 'exactCategory', description: '넷플릭스', category: '구독', rationale: '구독' },
    });
    await h.call('set_category', {
      batchId: out.batchId,
      changes: [{ id: idOf(4000), category: '식비' }],
    });

    const dry = await h.call<CommitBatchOutput>('commit_batch', {
      batchId: out.batchId,
      dryRun: true,
    });
    expect(dry.wouldCommit).toBe(3);
    expect(dry.retrospective).toMatchObject({
      byCategorySource: { rule: 1, llm: 1, user: 1 },
      userOverrides: 1,
      rulesSavedDuringBatch: 1,
      promotable: [],
      principlesTouched: [2, 3],
    });
    expect(dry.retrospective.unruledTop.map((u) => [u.description, u.category])).toEqual([
      ['월세', '기타'],
      ['이디야', '식비'],
    ]);

    const real = await h.call<CommitBatchOutput>('commit_batch', { batchId: out.batchId });
    expect(real.committed).toBe(3);
    const { promotable: _p1, ...dryRest } = dry.retrospective;
    const { promotable: _p2, ...realRest } = real.retrospective;
    expect(realRest).toEqual(dryRest);
  });

  it('승격 후보가 있으면 회고 promotable에 이번 배치의 행 id가 붙고, 막힌 커밋의 details에도 회고가 들어간다', async () => {
    // 지난 두 달: 이디야 → 식비 두 번
    for (const [label, date] of [
      ['2026-08', '2026-08-10'],
      ['2026-09', '2026-09-10'],
    ] as const) {
      const b = await stage(
        [tx({ description: '이디야', amount: 4000, category: null, date })],
        label
      );
      const r = (await h.call<ListStagedOutput>('list_staged', { batchId: b.batchId })).items[0]!;
      await h.call('set_category', {
        batchId: b.batchId,
        changes: [{ id: r.id, category: '식비' }],
      });
      await h.call('commit_batch', { batchId: b.batchId });
    }
    const third = await stage(
      [tx({ description: '이디야', amount: 4500, category: null, date: '2026-10-10' })],
      '2026-10'
    );
    const rowId = (await h.call<ListStagedOutput>('list_staged', { batchId: third.batchId }))
      .items[0]!.id;

    // 카테고리가 비어 있어 막힌다 — 그래도 회고는 details로 돌려준다
    const blocked = (await expectToolError(h, 'commit_batch', {
      batchId: third.batchId,
    })) as ToolErrorBody & {
      details: CommitBatchOutput;
    };
    expect(blocked.code).toBe('COMMIT_BLOCKED');
    expect(blocked.details.retrospective.promotable).toEqual([
      expect.objectContaining({
        key: normalize('이디야'),
        category: '식비',
        count: 2,
        rowIds: [rowId],
      }),
    ]);
    expect(blocked.details.retrospective.byCategorySource).toEqual({ rule: 0, llm: 0, user: 0 });
  });
});
