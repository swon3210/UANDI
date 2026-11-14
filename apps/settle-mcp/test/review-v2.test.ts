import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { recordDecision } from '../src/core/decisions';
import { normalize } from '../src/core/fingerprint';
import { createMasker, identityMasker } from '../src/core/mask';
import { reviewPlaybook, UNUSED_AFTER_DAYS } from '../src/core/review';
import { compileRules, DEFAULT_CARD_PAYMENT_RULE_ID, type RulesFile } from '../src/core/rules';
import type { ReviewPlaybookOutput } from '../src/tools/review-playbook';
import type { SaveRuleOutput } from '../src/tools/save-rule';
import { createHarness, type Harness } from './helpers';
import { containsRule, exactRule, ignoreRule, regexRule, rulesWith } from './rule-factories';

const NOW = '2026-10-01T00:00:00.000Z';
const OLD = '2026-06-01T00:00:00.000Z'; // 120일 전
const RECENT = '2026-09-20T00:00:00.000Z';

function fixture(): RulesFile {
  const stale = containsRule('이디야', '식비', { createdAt: OLD, rationale: '커피' }); // 0회, 오래됨 → unused
  const fading = exactRule('넷플릭스', '구독', {
    createdAt: OLD,
    hits: 3,
    lastHitAt: OLD,
    rationale: '구독',
  }); // 마지막 적용 오래됨 → unused
  const fresh = containsRule('배민', '식비', { createdAt: RECENT, rationale: null }); // 새 규칙, 이유 없음
  const wide = regexRule('스타', '기타', {
    createdAt: RECENT,
    rationale: '스타 뭐든',
    examples: ['스타벅스 강남'],
  });
  const narrow = containsRule('스타벅스', '식비', {
    createdAt: RECENT,
    source: 'promoted',
    rationale: null,
  });
  const cardCategory = containsRule('카드대금', '기타', {
    createdAt: RECENT,
    conflictsWith: [2],
    rationale: '카드값',
  });
  const oldDefaultLike = ignoreRule('관리비', '따로', {
    createdAt: OLD,
    source: 'user',
    rationale: '관리비는 따로',
  });
  let file = rulesWith({
    categoryRules: [stale, fading, fresh, wide, narrow, cardCategory],
    ignore: [...rulesWith({}).ignore, oldDefaultLike],
    aliases: { 박말순: '어머니' },
    insiders: [],
    principles: [
      {
        id: 'p1',
        text: '배달은 식비',
        topic: 'category',
        source: 'user',
        createdAt: NOW,
        ruleIds: [fresh.id],
      },
      {
        id: 'p2',
        text: '환불은 수입으로',
        topic: 'refund',
        source: 'interview',
        createdAt: NOW,
        ruleIds: [],
      },
    ],
  });
  file = recordDecision(
    file,
    { rawDescription: '박말순 용돈', category: '기타', batchId: 'b' },
    NOW
  ).file;
  file = recordDecision(
    file,
    { rawDescription: '박말순 용돈', category: '기타', batchId: 'b' },
    NOW
  ).file;
  file = recordDecision(file, { rawDescription: '쿠팡', category: '식비', batchId: 'b' }, NOW).file;
  file = recordDecision(file, { rawDescription: '쿠팡', category: '기타', batchId: 'b' }, NOW).file;
  return file;
}

describe('reviewPlaybook (core)', () => {
  it('안 쓰는 규칙·겹치는 규칙·이유 없는 규칙·승격 후보·불일치·원칙 충돌·말로만 있는 기준을 찾는다', () => {
    const file = fixture();
    const r = reviewPlaybook(compileRules(file), { now: NOW, masker: identityMasker });
    const byText = (t: string) =>
      file.categoryRules.find(
        (x) => x.match.kind !== 'regex' && ('text' in x.match ? x.match.text : x.match.key) === t
      )!;

    expect(r.principles.map((p) => p.id)).toEqual(['p1', 'p2']);
    // unused: 0회·오래된 이디야, 마지막 적용 오래된 넷플릭스, 오래된 관리비 ignore. default·최근 규칙은 제외
    expect(r.unused.map((x) => x.id).sort()).toEqual(
      [byText('이디야').id, byText(normalize('넷플릭스')).id, file.ignore[1]!.id].sort()
    );
    expect(r.unused.some((x) => x.id === DEFAULT_CARD_PAYMENT_RULE_ID)).toBe(false);
    // conflicts: '스타벅스 강남'(wide의 예시)에 wide(regex)·narrow(contains) 둘 다 맞는다
    expect(r.conflicts).toEqual([
      { rules: [byText('스타벅스').id, file.categoryRules[3]!.id].sort(), sample: '스타벅스 강남' },
    ]);
    // noRationale: user·promoted 중 rationale null — 배민(user), 스타벅스(promoted)
    expect(r.noRationale.sort()).toEqual([byText('배민').id, byText('스타벅스').id].sort());
    expect(r.promotable).toEqual([
      expect.objectContaining({
        kind: 'promote',
        key: normalize('박말순 용돈'),
        category: '기타',
        count: 2,
        rowIds: [],
      }),
    ]);
    expect(r.inconsistent).toEqual([
      expect.objectContaining({
        kind: 'inconsistent',
        key: normalize('쿠팡'),
        categories: ['식비', '기타'],
      }),
    ]);
    expect(r.principleConflicts).toEqual([{ ruleId: byText('카드대금').id, conflictsWith: [2] }]);
  });

  it('focus를 주면 그 항목만 계산하고, principlesWithoutRules는 말로만 있는 기준만 남긴다', () => {
    const r = reviewPlaybook(compileRules(fixture()), {
      now: NOW,
      masker: identityMasker,
      focus: ['principlesWithoutRules', 'promotable'],
    });
    expect(r.principles.map((p) => p.id)).toEqual(['p2']);
    expect(r.promotable).toHaveLength(1);
    expect(r.unused).toEqual([]);
    expect(r.conflicts).toEqual([]);
    expect(r.noRationale).toEqual([]);
    expect(r.inconsistent).toEqual([]);
    expect(r.principleConflicts).toEqual([]);
  });

  it('unused 경계: 정확히 60일은 아직 쓰는 규칙이다', () => {
    const edge = containsRule('x', '식비', {
      createdAt: new Date(Date.parse(NOW) - UNUSED_AFTER_DAYS * 86_400_000).toISOString(),
    });
    const over = containsRule('y', '식비', {
      createdAt: new Date(Date.parse(NOW) - (UNUSED_AFTER_DAYS + 1) * 86_400_000).toISOString(),
    });
    const r = reviewPlaybook(compileRules(rulesWith({ categoryRules: [edge, over] })), {
      now: NOW,
      masker: identityMasker,
      focus: ['unused'],
    });
    expect(r.unused.map((x) => x.id)).toEqual([over.id]);
  });

  it('마스커를 주면 승격 후보·불일치·충돌 sample과 안 쓰는 규칙의 키·예시에서 실명이 사라진다', () => {
    const file = fixture();
    const masked = reviewPlaybook(compileRules(file), { now: NOW, masker: createMasker(file) });
    expect(masked.promotable[0]).toMatchObject({ sample: '<실명 1> 용돈' });
    expect(JSON.stringify(masked)).not.toContain('박말순');
    const plain = reviewPlaybook(compileRules(file), { now: NOW, masker: identityMasker });
    expect(plain.promotable[0]).toMatchObject({ sample: '박말순 용돈' });
  });
});

describe('review_playbook (도구)', () => {
  let h: Harness;
  beforeEach(async () => {
    h = await createHarness();
  });
  afterEach(async () => {
    await h.close();
  });

  it('digest와 점검 결과를 돌려주고 아무것도 바꾸지 않는다', async () => {
    const p = await h.call<SaveRuleOutput>('save_rule', {
      rule: { kind: 'principle', text: '배달은 식비로 본다', topic: 'category' },
    });
    await h.call('save_rule', {
      rule: {
        kind: 'categoryRule',
        match: { kind: 'contains', text: '카드대금' },
        category: '기타',
      },
    });
    const before = JSON.stringify(await h.deps.store.listBatches('couple-1'));

    const out = await h.call<ReviewPlaybookOutput>('review_playbook', {});
    expect(out.digest).toMatchObject({
      principles: 1,
      categoryRules: 1,
      interviewDone: false,
      lastCommitAt: null,
    });
    expect(out.principles[0]!.id).toBe(p.savedId);
    expect(out.noRationale).toHaveLength(1);
    expect(out.principleConflicts).toEqual([{ ruleId: out.noRationale[0], conflictsWith: [2] }]);
    expect(out.unused).toEqual([]); // 방금 만든 규칙은 아직 안 쓰는 규칙이 아니다

    const focused = await h.call<ReviewPlaybookOutput>('review_playbook', { focus: ['unused'] });
    expect(focused.noRationale).toEqual([]);
    expect(focused.principles).toHaveLength(1);
    expect(JSON.stringify(await h.deps.store.listBatches('couple-1'))).toBe(before);
  });

  it('exposeAliasesInResource=false면 결과의 실명을 가린다', async () => {
    await h.close();
    h = await createHarness({ exposeAliases: false });
    await h.call('save_rule', { rule: { kind: 'alias', realName: '박말순', alias: '어머니' } });
    await h.call('save_rule', {
      rule: {
        kind: 'categoryRule',
        match: { kind: 'contains', text: '박말순' },
        category: '기타',
        evenIfTransfer: true,
        rationale: '어머니 용돈',
      },
    });
    const out = await h.call<ReviewPlaybookOutput>('review_playbook', {});
    expect(JSON.stringify(out)).not.toContain('박말순');
  });
});
