import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inconsistentDecisions, promotableDecisions, recordDecision } from '../src/core/decisions';
import { normalize } from '../src/core/fingerprint';
import { applyInterviewAnswers, CASH_WITHDRAWAL_PATTERN } from '../src/core/interview';
import {
  DEFAULT_CARD_PAYMENT_PATTERN,
  DEFAULT_CARD_PAYMENT_RULE_ID,
  DEFAULT_TRANSFER_RULE_ID,
  defaultRules,
  type RulesFile,
} from '../src/core/rules';
import type { ListStagedOutput } from '../src/tools/list-staged';
import type { SaveRuleOutput } from '../src/tools/save-rule';
import type { SetCategoryOutput } from '../src/tools/set-category';
import type { StageOutput } from '../src/tools/stage-transactions';
import { createHarness, expectToolError, tx, type Harness } from './helpers';

const names = new Set(['식비', '구독', '기타', '급여', '용돈', '현금']);
const NOW = '2026-10-01T00:00:00.000Z';

describe('결정 로그 (core/decisions)', () => {
  it('같은 적요·카테고리는 count가 오르고, 다른 카테고리는 따로 남아 inconsistent가 된다', () => {
    let file = defaultRules('c1', NOW);
    file = recordDecision(
      file,
      { rawDescription: '스타벅스 강남', category: '식비', batchId: 'b1' },
      NOW
    ).file;
    file = recordDecision(
      file,
      { rawDescription: '스타벅스강남', category: '식비', batchId: 'b2' },
      NOW
    ).file;
    const third = recordDecision(
      file,
      { rawDescription: '스타벅스 강남', category: '구독', batchId: 'b2' },
      NOW
    );
    file = third.file;
    expect(file.decisions.map((d) => [d.category, d.count])).toEqual([
      ['식비', 2],
      ['구독', 1],
    ]);
    expect(file.decisions[0]!.lastBatchId).toBe('b2');
    expect(promotableDecisions(file)).toEqual([
      { key: normalize('스타벅스 강남'), sample: '스타벅스강남', category: '식비', count: 2 },
    ]);
    expect(inconsistentDecisions(file)).toEqual([
      { key: normalize('스타벅스 강남'), sample: '스타벅스강남', categories: ['식비', '구독'] },
    ]);
  });

  it('exact 규칙이 이미 있는 key는 promotable에서 빠진다', () => {
    let file = defaultRules('c1', NOW);
    for (let i = 0; i < 3; i++) {
      file = recordDecision(
        file,
        { rawDescription: '넷플릭스', category: '구독', batchId: 'b' },
        NOW
      ).file;
    }
    expect(promotableDecisions(file)).toHaveLength(1);
    file.categoryRules.push({
      id: 'r',
      rationale: null,
      source: 'user',
      createdAt: NOW,
      hits: 0,
      lastHitAt: null,
      examples: [],
      conflictsWith: [],
      match: { kind: 'exact', key: normalize('넷플릭스') },
      category: '구독',
    });
    expect(promotableDecisions(file)).toEqual([]);
  });
});

describe('인터뷰 답 해석 (core/interview)', () => {
  it('기본 답(byCard·이름 등록·record·skip)은 기준 문장을 남기고 insiders·별칭·현금 무시 규칙을 만든다', () => {
    const out = applyInterviewAnswers(
      defaultRules('c1', NOW),
      {
        cardPayment: { choice: 'byCard' },
        partnerName: { names: [{ realName: '김영희', alias: '아내' }] },
        thirdParty: {
          choice: 'record',
          people: [{ realName: '박말순', alias: '어머니', category: '용돈' }],
        },
        cashRefund: { choices: ['skip'] },
      },
      names,
      NOW
    );
    const f = out.file;
    expect(out.warnings).toEqual([]);
    expect(f.interview).toEqual({
      completedAt: NOW,
      answers: {
        cardPayment: 'byCard',
        partnerName: 'provided',
        thirdParty: 'record',
        cashRefund: 'skip',
      },
    });
    expect(f.insiders).toEqual(['김영희']);
    expect(f.aliases).toEqual({ 김영희: '아내', 박말순: '어머니' });
    // 기본 카드대금 ignore는 그대로, 현금 인출 ignore가 추가
    expect(
      f.ignore.map(
        (r) => r.id === DEFAULT_CARD_PAYMENT_RULE_ID || r.pattern === CASH_WITHDRAWAL_PATTERN
      )
    ).toEqual([true, true]);
    // 어머니에게 보낸 돈은 송금이어도 용돈 지출
    const allowance = f.categoryRules.find(
      (r) => r.match.kind === 'contains' && r.match.text === '박말순'
    )!;
    expect(allowance).toMatchObject({
      category: '용돈',
      evenIfTransfer: true,
      source: 'interview',
      conflictsWith: [],
    });
    // 기준 문장 4개가 각자 규칙을 가리킨다
    expect(f.principles.map((p) => [p.topic, p.source, p.ruleIds.length])).toEqual([
      ['duplicate', 'interview', 1],
      ['transfer', 'interview', 1],
      ['transfer', 'interview', 1],
      ['cash', 'interview', 1],
    ]);
    expect(f.principles[0]!.ruleIds).toEqual([DEFAULT_CARD_PAYMENT_RULE_ID]);
    expect(f.principles[1]!.ruleIds).toEqual([DEFAULT_TRANSFER_RULE_ID]);
    expect(f.principles[1]!.text).toContain('아내');
    expect(f.principles[2]!.ruleIds).toEqual([allowance.id]);
    expect(out.createdRuleIds).toHaveLength(2);
    expect(out.createdPrincipleIds).toHaveLength(4);
  });

  it('byAccount는 기본 카드대금 무시를 지우고 카드대금 카테고리 규칙(conflictsWith [2])을 만들며 경고한다', () => {
    const out = applyInterviewAnswers(
      defaultRules('c1', NOW),
      { cardPayment: { choice: 'byAccount', category: '기타' } },
      names,
      NOW
    );
    expect(out.file.ignore.find((r) => r.id === DEFAULT_CARD_PAYMENT_RULE_ID)).toBeUndefined();
    const rule = out.file.categoryRules[0]!;
    expect(rule).toMatchObject({
      match: { kind: 'regex', pattern: DEFAULT_CARD_PAYMENT_PATTERN },
      category: '기타',
      onlyFor: { sourceKind: 'account', type: 'expense' },
      conflictsWith: [2],
      source: 'interview',
    });
    expect(out.warnings[0]).toMatch(/원칙 2: 같은 돈은 한 번만 적는다.*어긋나지만 저장/);
    expect(out.file.principles[0]!.ruleIds).toEqual([rule.id]);
  });

  it('카테고리가 필요한 답에 카테고리가 없거나 목록에 없으면 거절하고, 이름을 건너뛰면 경고만 남긴다', () => {
    const base = defaultRules('c1', NOW);
    expect(() =>
      applyInterviewAnswers(base, { cardPayment: { choice: 'byAccount' } }, names, NOW)
    ).toThrow(/카테고리를 함께/);
    expect(() =>
      applyInterviewAnswers(
        base,
        { cashRefund: { choices: ['cashAsExpense'], cashCategory: '없음' } },
        names,
        NOW
      )
    ).toThrow(/목록에 없습니다/);

    const skipped = applyInterviewAnswers(base, { partnerName: { skipped: true } }, names, NOW);
    expect(skipped.file.insiders).toEqual([]);
    expect(skipped.file.interview.answers.partnerName).toBe('skipped');
    expect(skipped.warnings[0]).toMatch(/송금 패턴/);
    expect(skipped.file.interview.completedAt).toBe(NOW);
  });

  it('현금을 지출로·환불을 수입으로 — 현금은 evenIfTransfer 규칙, 환불은 말로만 있는 기준', () => {
    const out = applyInterviewAnswers(
      defaultRules('c1', NOW),
      {
        cashRefund: {
          choices: ['cashAsExpense', 'refundAsIncome'],
          cashCategory: '현금',
          refundCategory: '급여',
        },
      },
      names,
      NOW
    );
    expect(out.file.categoryRules[0]).toMatchObject({
      match: { kind: 'regex', pattern: CASH_WITHDRAWAL_PATTERN },
      category: '현금',
      evenIfTransfer: true,
    });
    expect(out.file.principles.map((p) => [p.topic, p.ruleIds.length])).toEqual([
      ['cash', 1],
      ['refund', 0],
    ]);
    expect(out.file.principles[1]!.text).toContain('급여');
    expect(out.file.interview.answers.cashRefund).toBe('cashAsExpense,refundAsIncome');
  });
});

describe('save_rule v2 / set_category 결정 로그 (도구)', () => {
  let h: Harness;
  beforeEach(async () => {
    h = await createHarness();
  });
  afterEach(async () => {
    await h.close();
  });
  const stage = (transactions: ReturnType<typeof tx>[], label = '2026-09 테스트') =>
    h.call<StageOutput>('stage_transactions', {
      label,
      source: { kind: 'account', name: 'KB' },
      transactions,
    });
  const rulesOnDisk = async () => JSON.parse(await readFile(h.deps.rulesPath, 'utf8')) as RulesFile;

  it('set_category로 두 번 같은 카테고리를 고르면 promotable이 올라오고, promote가 규칙으로 만들어 결정을 지운다', async () => {
    const b1 = await stage([tx({ description: '이디야 커피', amount: 4000, category: null })]);
    const r1 = (await h.call<ListStagedOutput>('list_staged', { batchId: b1.batchId })).items[0]!;
    const first = await h.call<SetCategoryOutput>('set_category', {
      batchId: b1.batchId,
      changes: [{ id: r1.id, category: '식비' }],
    });
    expect(first.promotable).toEqual([]);
    expect((await rulesOnDisk()).decisions).toMatchObject([
      { key: normalize('이디야 커피'), count: 1 },
    ]);

    const b2 = await stage(
      [tx({ description: '이디야커피', amount: 4500, category: null })],
      '2026-10 테스트'
    );
    const r2 = (await h.call<ListStagedOutput>('list_staged', { batchId: b2.batchId })).items[0]!;
    const second = await h.call<SetCategoryOutput>('set_category', {
      batchId: b2.batchId,
      changes: [
        { id: r2.id, category: '식비' },
        { id: r2.id, status: 'pending' },
      ],
    });
    expect(second.promotable).toEqual([
      { key: normalize('이디야 커피'), sample: '이디야커피', category: '식비', count: 2 },
    ]);
    // 상태만 바꾼 변경은 로그에 안 남는다
    expect((await rulesOnDisk()).decisions).toHaveLength(1);

    const promoted = await h.call<SaveRuleOutput>('save_rule', {
      rule: { kind: 'promote', key: '이디야 커피', category: '식비', rationale: '커피는 식비' },
    });
    expect(promoted.savedId).toBeTruthy();
    const rule = promoted.rules.categoryRules.find((r) => r.id === promoted.savedId)!;
    expect(rule).toMatchObject({
      match: { kind: 'exact', key: normalize('이디야 커피') },
      category: '식비',
      source: 'promoted',
      rationale: '커피는 식비',
      examples: ['이디야커피'],
    });
    expect(promoted.rules.decisions).toEqual([]);
    // 커밋 전 배치(b2)에 바로 적용되어 rule 출처가 된다 — 단 사용자가 고른 행은 user로 남는다
    const after = (await h.call<ListStagedOutput>('list_staged', { batchId: b2.batchId }))
      .items[0]!;
    expect(after.categorySource).toBe('user');

    const b3 = await stage(
      [
        tx({ description: '이디야 커피 판교', amount: 1, category: null }),
        tx({ description: '이디야 커피', amount: 2, category: null }),
      ],
      '2026-11'
    );
    const rows = (await h.call<ListStagedOutput>('list_staged', { batchId: b3.batchId })).items;
    expect(rows.find((r) => r.amount === 2)).toMatchObject({
      category: '식비',
      categorySource: 'rule',
      appliedRuleId: rule.id,
    });
    expect(rows.find((r) => r.amount === 1)!.category).toBeNull();

    const missing = await expectToolError(h, 'save_rule', {
      rule: { kind: 'promote', key: '없는 적요', category: '식비' },
    });
    expect(missing.code).toBe('INVALID_INPUT');
  });

  it('principle → categoryRule(linkToPrincipleId)로 기준과 규칙이 연결되고, id로 지우면 연결이 끊긴다', async () => {
    const p = await h.call<SaveRuleOutput>('save_rule', {
      rule: {
        kind: 'principle',
        text: '배달앱 결제는 외식이 아니라 식비로 본다',
        topic: 'category',
      },
    });
    expect(p.rules.principles[0]).toMatchObject({ id: p.savedId, source: 'user', ruleIds: [] });

    const r = await h.call<SaveRuleOutput>('save_rule', {
      rule: {
        kind: 'categoryRule',
        match: { kind: 'contains', text: '배민' },
        category: '식비',
        rationale: '배달은 식비',
        linkToPrincipleId: p.savedId,
      },
    });
    expect(r.rules.principles[0]!.ruleIds).toEqual([r.savedId]);
    expect(r.warnings).toEqual([]);

    const staged = await stage([
      tx({ description: '배민 주문 1234', amount: 15000, category: '기타' }),
    ]);
    expect(staged.summary.pending).toBe(1);
    const row = (await h.call<ListStagedOutput>('list_staged', { batchId: staged.batchId }))
      .items[0]!;
    expect(row).toMatchObject({
      category: '식비',
      categorySource: 'rule',
      appliedRuleId: r.savedId,
    });

    const removed = await h.call<SaveRuleOutput>('save_rule', {
      rule: { kind: 'remove', id: r.savedId },
    });
    expect(removed.rules.categoryRules).toEqual([]);
    expect(removed.rules.principles[0]!.ruleIds).toEqual([]);
    expect(removed.appliedToBatch!.changed).toBe(1);

    const badLink = await expectToolError(h, 'save_rule', {
      rule: {
        kind: 'exactCategory',
        description: 'x',
        category: '식비',
        linkToPrincipleId: 'nope',
      },
    });
    expect(badLink.code).toBe('INVALID_INPUT');
    const noKey = await expectToolError(h, 'save_rule', { rule: { kind: 'remove' } });
    expect(noKey.code).toBe('INVALID_INPUT');
  });

  it('원칙과 어긋나는 저장은 막지 않고 conflictsWith·warnings로 알린다', async () => {
    const card = await h.call<SaveRuleOutput>('save_rule', {
      rule: {
        kind: 'categoryRule',
        match: { kind: 'contains', text: '카드대금' },
        category: '기타',
      },
    });
    expect(card.rules.categoryRules[0]!.conflictsWith).toEqual([2]);
    expect(card.warnings[0]).toMatch(
      /원칙 2\(같은 돈은 한 번만 적는다\)와 어긋나지만 저장했습니다/
    );

    const removedDefault = await h.call<SaveRuleOutput>('save_rule', {
      rule: { kind: 'remove', id: DEFAULT_TRANSFER_RULE_ID },
    });
    expect(removedDefault.rules.transfer).toEqual([]);
    expect(removedDefault.warnings[0]).toMatch(/원칙 3.*지웠습니다/);

    await h.call('save_rule', {
      rule: {
        kind: 'interview',
        answers: { partnerName: { names: [{ realName: '김영희', alias: '아내' }] } },
      },
    });
    const insiderExpense = await h.call<SaveRuleOutput>('save_rule', {
      rule: {
        kind: 'categoryRule',
        match: { kind: 'contains', text: '김영희' },
        category: '기타',
        evenIfTransfer: true,
      },
    });
    expect(insiderExpense.rules.categoryRules.at(-1)!.conflictsWith).toEqual([3]);
    expect(insiderExpense.warnings[0]).toMatch(/원칙 3/);
  });

  it('interview는 completedAt을 채우고, reset은 기준·규칙을 남긴 채 completedAt만 비운다', async () => {
    const done = await h.call<SaveRuleOutput>('save_rule', {
      rule: {
        kind: 'interview',
        answers: {
          cardPayment: { choice: 'byCard' },
          partnerName: { skipped: true },
          thirdParty: { choice: 'skip' },
          cashRefund: { choices: ['skip'] },
        },
      },
    });
    expect(done.rules.interview.completedAt).toBeTruthy();
    expect(done.rules.principles).toHaveLength(3);
    expect(done.warnings).toHaveLength(1); // 이름 건너뜀 경고

    const reset = await h.call<SaveRuleOutput>('save_rule', {
      rule: { kind: 'interview', reset: true },
    });
    expect(reset.rules.interview).toEqual({ completedAt: null, answers: {} });
    expect(reset.rules.principles).toHaveLength(3);

    const empty = await expectToolError(h, 'save_rule', { rule: { kind: 'interview' } });
    expect(empty.code).toBe('INVALID_INPUT');
    const both = await expectToolError(h, 'save_rule', {
      rule: { kind: 'interview', reset: true, answers: { cardPayment: { choice: 'byCard' } } },
    });
    expect(both.code).toBe('INVALID_INPUT');
  });

  it('v1 호환 — exactCategory에 rationale이 붙고 같은 적요는 메타를 보존한 채 덮어쓴다', async () => {
    const a = await h.call<SaveRuleOutput>('save_rule', {
      rule: {
        kind: 'exactCategory',
        description: '넷플릭스',
        category: '구독',
        rationale: '구독은 구독',
      },
    });
    const b = await h.call<SaveRuleOutput>('save_rule', {
      rule: { kind: 'exactCategory', description: '넷플릭스', category: '기타' },
    });
    expect(b.rules.categoryRules).toHaveLength(1);
    expect(b.rules.categoryRules[0]).toMatchObject({
      id: a.savedId,
      category: '기타',
      rationale: '구독은 구독',
    });
  });
});
