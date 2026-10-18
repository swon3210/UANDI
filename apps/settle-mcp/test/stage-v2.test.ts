import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { recordDecision } from '../src/core/decisions';
import { normalize } from '../src/core/fingerprint';
import { defaultRules } from '../src/core/rules';
import { buildSuggestions } from '../src/core/suggestions';
import type { StagedTransaction } from '../src/core/types';
import type { ListStagedOutput } from '../src/tools/list-staged';
import type { SaveRuleOutput } from '../src/tools/save-rule';
import type { StageOutput } from '../src/tools/stage-transactions';
import { createHarness, tx, type Harness } from './helpers';
import { containsRule, exactRule, rulesWith } from './rule-factories';

const NOW = '2026-10-01T00:00:00.000Z';
const row = (over: Partial<StagedTransaction> & { id: string }): StagedTransaction => ({
  batchId: 'b',
  fingerprint: 'f',
  date: '2026-09-10',
  amount: 5000,
  type: 'expense',
  rawDescription: '스타벅스',
  description: '스타벅스',
  category: null,
  categorySource: null,
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

describe('buildSuggestions (core)', () => {
  it('promote·pastDecision·inconsistent·bigUnruled를 종류 순으로 만들고 행에 id를 붙인다', () => {
    let file = defaultRules('c1', NOW);
    // 이디야: 식비로 2번 → promote 후보. 스타벅스: 식비 1번·구독 1번 → inconsistent, pastDecision은 최근 것
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
    file = recordDecision(
      file,
      { rawDescription: '스타벅스', category: '식비', batchId: 'b0' },
      '2026-09-01T00:00:00.000Z'
    ).file;
    file = recordDecision(
      file,
      { rawDescription: '스타벅스', category: '구독', batchId: 'b0' },
      NOW
    ).file;
    const ruled = exactRule('넷플릭스', '구독');
    file.categoryRules.push(ruled);

    const rows = [
      row({
        id: 'a',
        rawDescription: '이디야',
        amount: 4000,
        category: '식비',
        categorySource: 'llm',
      }),
      row({ id: 'b', rawDescription: '스타벅스', amount: 6000 }),
      row({
        id: 'c',
        rawDescription: '넷플릭스',
        amount: 17000,
        category: '구독',
        categorySource: 'rule',
        appliedRuleId: ruled.id,
      }),
      row({ id: 'd', rawDescription: '신한카드 대금', amount: 900000, status: 'ignored' }),
      row({
        id: 'e',
        rawDescription: '월세',
        amount: 800000,
        category: '기타',
        categorySource: 'llm',
      }),
      row({
        id: 'f',
        rawDescription: '스타벅스',
        amount: 100,
        category: '식비',
        categorySource: 'user',
      }),
    ];
    const { suggestions, byRow } = buildSuggestions(rows, file);

    // f(categorySource 'user')는 스테이징 시점엔 생길 수 없는 행이지만, 빌더는 'rule'만 제외하므로 bigUnruled에 든다
    expect(suggestions.map((s) => s.kind)).toEqual([
      'promote',
      'pastDecision', // b (스타벅스, 비어 있음 → 최근 결정 '구독'). a는 llm 후보와 같은 결정이라 안 붙는다
      'inconsistent',
      'bigUnruled', // e 800000 llm
      'bigUnruled', // b 6000 null
      'bigUnruled', // a 4000 llm
      'bigUnruled', // f 100 user
    ]);

    const promote = suggestions.find((s) => s.kind === 'promote')!;
    expect(promote).toMatchObject({
      key: normalize('이디야'),
      category: '식비',
      count: 2,
      rowIds: ['a'],
    });

    const past = suggestions.filter((s) => s.kind === 'pastDecision');
    // a는 LLM 후보(식비)가 과거 결정(식비)과 같아 제안이 붙지 않는다
    expect(past.map((s) => s.kind === 'pastDecision' && [s.rowId, s.category, s.count])).toEqual([
      ['b', '구독', 1],
    ]);

    const inc = suggestions.find((s) => s.kind === 'inconsistent')!;
    expect(inc).toMatchObject({ key: normalize('스타벅스'), categories: ['식비', '구독'] });

    const big = suggestions.filter((s) => s.kind === 'bigUnruled');
    // 무시(d)·규칙(c)은 제외, 금액 큰 순
    expect(big.map((s) => s.kind === 'bigUnruled' && s.rowId)).toEqual(['e', 'b', 'a', 'f']);

    expect(byRow.get('a')).toEqual([promote.id, big[2]!.id]);
    expect(byRow.get('b')).toEqual([past[0]!.id, inc.id, big[1]!.id]);
    expect(byRow.get('c')).toBeUndefined();
    expect(byRow.get('d')).toBeUndefined();
    expect(byRow.get('f')).toEqual([inc.id, big[3]!.id]);
  });

  it('bigUnruled는 금액 상위 10건까지만 본다', () => {
    const file = defaultRules('c1', NOW);
    const rows = Array.from({ length: 15 }, (_, i) =>
      row({ id: `r${i}`, amount: 1000 * (i + 1), category: '기타', categorySource: 'llm' })
    );
    const { suggestions } = buildSuggestions(rows, file);
    const big = suggestions.filter((s) => s.kind === 'bigUnruled');
    expect(big).toHaveLength(10);
    expect(big[0]).toMatchObject({ rowId: 'r14', amount: 15000 });
    expect(big.some((s) => s.kind === 'bigUnruled' && s.rowId === 'r4')).toBe(false);
  });
});

describe('stage_transactions v2 응답 (도구)', () => {
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

  it('needsAttention은 금액 내림차순이고, 규칙이 겹치면 conflicts에 보고하며 행에 suggestionIds가 붙는다', async () => {
    const wide = await h.call<SaveRuleOutput>('save_rule', {
      rule: { kind: 'categoryRule', match: { kind: 'contains', text: '배민' }, category: '식비' },
    });
    const narrow = await h.call<SaveRuleOutput>('save_rule', {
      rule: {
        kind: 'categoryRule',
        match: { kind: 'contains', text: '배민 라이더스' },
        category: '기타',
      },
    });
    const out = await stage([
      tx({ description: '홍길동 이체', amount: 50000, category: null }),
      tx({ description: '이디야', amount: 4000, category: null }),
      tx({ description: '월세', amount: 800000, category: null }),
      tx({ description: '배민 라이더스 결제', amount: 15000, category: '구독' }),
    ]);
    expect(out.needsAttention.map((r) => r.amount)).toEqual([800000, 50000, 4000]);
    expect(out.conflicts).toEqual([
      {
        rowId: expect.any(String),
        matchedRuleIds: [narrow.savedId, wide.savedId],
        appliedRuleId: narrow.savedId,
      },
    ]);
    expect(out.warnings).toEqual([]);
    expect(out.playbookDigest).toMatchObject({
      categoryRules: 2,
      ignore: 1,
      transfer: 1,
      interviewDone: false,
      lastCommitAt: null,
    });
    // 규칙 없는 큰 금액: 월세·이체·이디야 (배민은 rule)
    const big = out.suggestions.filter((s) => s.kind === 'bigUnruled');
    expect(big.map((s) => s.kind === 'bigUnruled' && s.amount)).toEqual([800000, 50000, 4000]);
    const rows = (await h.call<ListStagedOutput>('list_staged', { batchId: out.batchId })).items;
    const rent = rows.find((r) => r.amount === 800000)!;
    expect(rent.suggestionIds).toEqual([big[0]!.id]);
    expect(rows.find((r) => r.amount === 15000)!.suggestionIds).toEqual([]);
  });

  it('지난달 결정이 pastDecision·promote로 올라오고, 같은 라벨을 다시 넣으면 경고한다', async () => {
    const first = await stage(
      [tx({ description: '이디야 커피', amount: 4000, category: null })],
      '2026-09 KB'
    );
    const r1 = (await h.call<ListStagedOutput>('list_staged', { batchId: first.batchId }))
      .items[0]!;
    await h.call('set_category', {
      batchId: first.batchId,
      changes: [{ id: r1.id, category: '식비' }],
    });
    await h.call('commit_batch', { batchId: first.batchId });

    const second = await stage(
      [tx({ description: '이디야커피', amount: 4500, category: null })],
      '2026-10 KB'
    );
    const past = second.suggestions.filter((s) => s.kind === 'pastDecision');
    expect(past).toHaveLength(1);
    expect(past[0]).toMatchObject({ category: '식비', count: 1 });
    expect(second.suggestions.some((s) => s.kind === 'promote')).toBe(false);
    expect(second.playbookDigest.lastCommitAt).toBeTruthy();

    const r2 = (await h.call<ListStagedOutput>('list_staged', { batchId: second.batchId }))
      .items[0]!;
    await h.call('set_category', {
      batchId: second.batchId,
      changes: [{ id: r2.id, category: '식비' }],
    });

    // 세 번째: 이제 count 2 → promote 제안. 같은 라벨 '2026-09 KB' 재사용 → 경고
    const third = await stage(
      [tx({ description: '이디야 커피', amount: 1, category: null })],
      '2026-09 KB'
    );
    const promote = third.suggestions.find((s) => s.kind === 'promote')!;
    expect(promote).toMatchObject({ key: normalize('이디야 커피'), category: '식비', count: 2 });
    expect(third.warnings).toHaveLength(1);
    expect(third.warnings[0]).toMatch(/같은 라벨 "2026-09 KB".*이미 커밋.*원칙 2/);
  });

  it('무시된 행은 제안 대상이 아니고, 승격된 규칙이 있는 key는 promote가 아니라 rule 적용으로 끝난다', async () => {
    const out = await stage([
      tx({ description: '신한카드 대금', amount: 900000, category: null }),
      tx({ description: '넷플릭스', amount: 17000, category: '구독' }),
    ]);
    expect(out.summary.ignored).toBe(1);
    expect(
      out.suggestions
        .filter((s) => s.kind === 'bigUnruled')
        .map((s) => s.kind === 'bigUnruled' && s.amount)
    ).toEqual([17000]);
    expect(
      buildSuggestions([], rulesWith({ categoryRules: [containsRule('x', '식비')] })).suggestions
    ).toEqual([]);
  });
});
