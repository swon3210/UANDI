import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { normalize } from '../src/core/fingerprint';
import { principleLabel } from '../src/core/principles';
import {
  applyRules,
  compileRules,
  DEFAULT_CARD_PAYMENT_PATTERN,
  DEFAULT_CARD_PAYMENT_RULE_ID,
  DEFAULT_TRANSFER_PATTERN,
  DEFAULT_TRANSFER_RULE_ID,
  defaultRules,
  loadRules,
  matchCategory,
  matchTransfer,
  migrateV1ToV2,
  recordHits,
  rulesBackupPath,
  rulesFileSchema,
  writeRules,
  type RulesFileV1,
} from '../src/core/rules';
import { maskAliases } from '../src/resources/index';
import { containsRule, exactRule, regexRule, rulesWith } from './rule-factories';

const names = new Set(['식비', '구독', '생활용품', '용돈']);
const card = (rawDescription: string, llmCategory: string | null = null) => ({
  rawDescription,
  type: 'expense' as const,
  llmCategory,
});

describe('규칙 파일 v2 — 기본값·승격', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'settle-rules-v2-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('기본 파일은 v2이고 기본 규칙은 고정 ID·source default·원칙 rationale을 가진다', () => {
    const file = defaultRules('c1');
    expect(rulesFileSchema.safeParse(file).success).toBe(true);
    expect(file.ignore[0]).toMatchObject({
      id: DEFAULT_CARD_PAYMENT_RULE_ID,
      source: 'default',
      rationale: principleLabel(2),
      hits: 0,
      conflictsWith: [],
    });
    expect(file.transfer[0]).toMatchObject({
      id: DEFAULT_TRANSFER_RULE_ID,
      source: 'default',
      rationale: principleLabel(3),
    });
    expect(file.interview).toEqual({ completedAt: null, answers: {} });
    expect(file.principles).toEqual([]);
    expect(file.insiders).toEqual([]);
  });

  const v1: RulesFileV1 = {
    version: 1,
    coupleId: 'c1',
    exactCategory: { [normalize('스타벅스 코리아')]: '식비', [normalize('넷플릭스')]: '구독' },
    ignore: [
      {
        pattern: DEFAULT_CARD_PAYMENT_PATTERN,
        reason: '카드대금',
        onlyFor: { sourceKind: 'account', type: 'expense' },
      },
      { pattern: '관리비', reason: '따로 적음' },
    ],
    transfer: [{ pattern: DEFAULT_TRANSFER_PATTERN }, { pattern: '정산', requireKnownName: true }],
    aliases: { 홍길동: '처형' },
  };

  it('v1 → v2: exactCategory는 exact 규칙(user), 기본 패턴은 default ID, 나머지는 비어 있다', () => {
    const v2 = migrateV1ToV2(v1, '2026-10-01T00:00:00.000Z');
    expect(rulesFileSchema.safeParse(v2).success).toBe(true);
    expect(v2.categoryRules.map((r) => [r.match, r.category, r.source])).toEqual([
      [{ kind: 'exact', key: normalize('스타벅스 코리아') }, '식비', 'user'],
      [{ kind: 'exact', key: normalize('넷플릭스') }, '구독', 'user'],
    ]);
    expect(v2.ignore.map((r) => [r.id === DEFAULT_CARD_PAYMENT_RULE_ID, r.source])).toEqual([
      [true, 'default'],
      [false, 'user'],
    ]);
    expect(v2.ignore[1]!.onlyFor).toBeUndefined();
    expect(v2.transfer.map((r) => [r.id === DEFAULT_TRANSFER_RULE_ID, r.requireKnownName])).toEqual(
      [
        [true, undefined],
        [false, true],
      ]
    );
    expect(v2.aliases).toEqual({ 홍길동: '처형' });
    expect(v2.interview.completedAt).toBeNull();
    expect(v2.decisions).toEqual([]);
    // 승격된 규칙은 모두 적용 이력이 없다
    expect(v2.categoryRules.every((r) => r.hits === 0 && r.rationale === null)).toBe(true);
  });

  it('v1 파일 로드 → 메모리는 v2, 원본은 .v1.bak.json에 보관, 디스크는 다음 쓰기에서 v2가 된다', async () => {
    const path = join(dir, 'rules.json');
    const raw = JSON.stringify(v1, null, 2);
    await writeFile(path, raw);

    const compiled = await loadRules(path, 'c1');
    expect(compiled.file.version).toBe(2);
    expect(compiled.categoryExact.get(normalize('넷플릭스'))![0]!.category).toBe('구독');
    // 디스크는 아직 v1
    expect(JSON.parse(await readFile(path, 'utf8')).version).toBe(1);
    expect(await readFile(rulesBackupPath(path), 'utf8')).toBe(raw);
    expect((await readdir(dir)).sort()).toEqual(['rules.json', 'rules.v1.bak.json']);

    await writeRules(path, compiled.file);
    expect(JSON.parse(await readFile(path, 'utf8')).version).toBe(2);

    // v2 재로드는 무변경·백업 덮어쓰기 없음
    const again = await loadRules(path, 'c1');
    expect(again.file).toEqual(compiled.file);
    expect(await readFile(rulesBackupPath(path), 'utf8')).toBe(raw);
  });

  it('다른 커플의 v1 파일, 형식이 틀린 v2 파일은 RULES_INVALID', async () => {
    const path = join(dir, 'rules.json');
    await writeFile(path, JSON.stringify({ ...v1, coupleId: 'other' }));
    await expect(loadRules(path, 'c1')).rejects.toMatchObject({ code: 'RULES_INVALID' });

    await writeFile(
      path,
      JSON.stringify({
        ...defaultRules('c1'),
        categoryRules: [{ id: 'x', match: { kind: 'exact' } }],
      })
    );
    await expect(loadRules(path, 'c1')).rejects.toMatchObject({ code: 'RULES_INVALID' });

    await writeFile(path, JSON.stringify({ ...defaultRules('c1'), insiders: [''] }));
    await expect(loadRules(path, 'c1')).rejects.toMatchObject({ code: 'RULES_INVALID' });
  });

  it('비어 있는 exact·contains 키와 너무 넓은 regex 카테고리 규칙은 컴파일 단계에서 거절한다', () => {
    expect(() => compileRules(rulesWith({ categoryRules: [exactRule(' - ', '식비')] }))).toThrow();
    expect(() =>
      compileRules(rulesWith({ categoryRules: [containsRule('!!', '식비')] }))
    ).toThrow();
    expect(() => compileRules(rulesWith({ categoryRules: [regexRule('.*', '식비')] }))).toThrow();
  });
});

describe('카테고리 규칙 적용 순서 — exact → contains → regex', () => {
  it('exact가 contains·regex보다 먼저고, 이긴 단계의 나머지 규칙만 충돌로 보고한다', () => {
    const exact = exactRule('스타벅스 코리아', '구독');
    const contains = containsRule('스타벅스', '식비');
    const regex = regexRule('스타', '생활용품');
    const rules = compileRules(rulesWith({ categoryRules: [regex, contains, exact] }));

    const hit = matchCategory('스타벅스코리아', 'expense', 'card', rules, names);
    expect(hit.applied?.id).toBe(exact.id);
    expect(hit.conflicts).toEqual([]); // 다른 단계는 충돌이 아니다

    const partial = matchCategory('스타벅스 강남점', 'expense', 'card', rules, names);
    expect(partial.applied?.id).toBe(contains.id);

    const onlyRegex = matchCategory('스타 마트', 'expense', 'card', rules, names);
    expect(onlyRegex.applied?.id).toBe(regex.id);
  });

  it('contains가 둘 이상 맞으면 text가 긴 것이 이기고, exact·regex 동률은 먼저 저장된 것이 이긴다', () => {
    const short = containsRule('배민', '식비');
    const long = containsRule('배민 라이더스', '용돈'); // 더 좁다
    const rules = compileRules(rulesWith({ categoryRules: [short, long] }));
    const r = matchCategory('배민 라이더스 결제', 'expense', 'card', rules, names);
    expect(r.applied?.id).toBe(long.id);
    expect(r.conflicts.map((c) => c.id)).toEqual([short.id]);

    const first = exactRule('넷플릭스', '구독');
    const second = exactRule('넷플릭스', '식비');
    const exactRules = compileRules(rulesWith({ categoryRules: [first, second] }));
    const e = matchCategory('넷플릭스', 'expense', 'card', exactRules, names);
    expect(e.applied?.id).toBe(first.id);
    expect(e.conflicts.map((c) => c.id)).toEqual([second.id]);

    const re1 = regexRule('쿠팡', '생활용품');
    const re2 = regexRule('쿠팡(이츠)?', '식비');
    const regexRules = compileRules(rulesWith({ categoryRules: [re1, re2] }));
    expect(matchCategory('쿠팡이츠', 'expense', 'card', regexRules, names).applied?.id).toBe(
      re1.id
    );
  });

  it('카테고리가 목록에 없거나 onlyFor가 안 맞는 규칙은 없는 것으로 치고 다음 단계로 간다', () => {
    const stale = exactRule('넷플릭스', '없어진카테고리');
    const scoped = exactRule('넷플릭스', '구독', { onlyFor: { sourceKind: 'account' } });
    const fallback = containsRule('넷플', '식비');
    const rules = compileRules(rulesWith({ categoryRules: [stale, scoped, fallback] }));

    const onCard = applyRules(card('넷플릭스', '생활용품'), 'card', rules, names);
    expect(onCard.category).toBe('식비');
    expect(onCard.appliedRuleId).toBe(fallback.id);
    expect(onCard.conflictRuleIds).toEqual([]);

    const onAccount = applyRules(card('넷플릭스'), 'account', rules, names);
    expect(onAccount.category).toBe('구독');
    expect(onAccount.appliedRuleId).toBe(scoped.id);
  });

  it('규칙이 없으면 LLM 후보, 후보가 목록에 없으면 null — appliedRuleId는 null', () => {
    const rules = compileRules(defaultRules('c1'));
    expect(applyRules(card('이디야', '식비'), 'card', rules, names)).toMatchObject({
      category: '식비',
      categorySource: 'llm',
      appliedRuleId: null,
      hitRuleIds: [],
    });
    expect(applyRules(card('이디야', '없음'), 'card', rules, names)).toMatchObject({
      category: null,
      categorySource: null,
    });
  });
});

describe('송금 판정 — insiders·evenIfTransfer', () => {
  it('적요에 우리 중 한 사람의 이름이 있으면 송금 패턴이 없어도 transfer이고, statusReason에는 별칭만 남는다', () => {
    const rules = compileRules(rulesWith({ aliases: { 김영희: '아내' }, insiders: ['김영희'] }));
    const r = applyRules(card('김영희 50000'), 'account', rules, names);
    expect(r.status).toBe('transfer');
    expect(r.statusReason).toBe('transfer:insider:아내');
    expect(r.statusReason).not.toContain('김영희');
    expect(r.description).toBe('아내 50000');
    // insider 판정은 규칙 id가 없으므로 hits에 들어가지 않는다
    expect(r.hitRuleIds).toEqual([]);

    const noAlias = compileRules(rulesWith({ insiders: ['김영희'] }));
    expect(applyRules(card('김영희 50000'), 'account', noAlias, names).statusReason).toBe(
      'transfer:insider:우리'
    );
    expect(matchTransfer('회사 급여', noAlias)).toBeNull();
  });

  it('패턴 송금은 규칙 id가 hits에 들어가고, insider보다 먼저 판정된다', () => {
    const rules = compileRules(rulesWith({ insiders: ['김영희'] }));
    const r = applyRules(card('김영희 이체'), 'account', rules, names);
    expect(r.statusReason).toBe(`transfer:${DEFAULT_TRANSFER_PATTERN}`);
    expect(r.hitRuleIds).toEqual([DEFAULT_TRANSFER_RULE_ID]);
  });

  it('evenIfTransfer 카테고리 규칙은 송금 패턴·insiders를 이기고 pending으로 둔다', () => {
    const allowance = containsRule('어머니', '용돈', { evenIfTransfer: true });
    const rules = compileRules(
      rulesWith({
        categoryRules: [allowance],
        aliases: { 박말순: '어머니', 김영희: '아내' },
        insiders: ['김영희'],
      })
    );
    // 별칭 치환 전 원문에는 '어머니'가 없다 — contains는 rawDescription 기준이므로 실명 규칙을 써야 한다
    expect(applyRules(card('박말순 이체'), 'account', rules, names).status).toBe('transfer');

    const byRealName = compileRules(
      rulesWith({
        categoryRules: [containsRule('박말순', '용돈', { evenIfTransfer: true })],
        aliases: { 박말순: '어머니' },
      })
    );
    const r = applyRules(card('박말순 이체'), 'account', byRealName, names);
    expect(r).toMatchObject({
      status: 'pending',
      category: '용돈',
      categorySource: 'rule',
      description: '어머니 이체',
    });
    expect(r.hitRuleIds).toEqual([byRealName.file.categoryRules[0]!.id]);

    const plain = compileRules(
      rulesWith({ categoryRules: [containsRule('박말순', '용돈')], aliases: { 박말순: '어머니' } })
    );
    expect(applyRules(card('박말순 이체'), 'account', plain, names).status).toBe('transfer');
  });

  it('무시 규칙이 먼저다 — ignored 행은 카테고리 규칙이 맞아도 hits에 무시 규칙만 남는다', () => {
    const rules = compileRules(rulesWith({ categoryRules: [containsRule('신한카드', '식비')] }));
    const r = applyRules(card('신한카드 대금'), 'account', rules, names);
    expect(r.status).toBe('ignored');
    expect(r.hitRuleIds).toEqual([DEFAULT_CARD_PAYMENT_RULE_ID]);
  });
});

describe('recordHits / maskAliases', () => {
  it('적용 횟수·마지막 적용일·예시(중복 없이 3개)를 기록하고 원본은 바꾸지 않는다', () => {
    const rule = containsRule('스타벅스', '식비');
    const file = rulesWith({ categoryRules: [rule] });
    const next = recordHits(
      file,
      [
        { ruleId: rule.id, rawDescription: '스타벅스 강남' },
        { ruleId: rule.id, rawDescription: '스타벅스 강남' },
        { ruleId: rule.id, rawDescription: '스타벅스 역삼' },
        { ruleId: rule.id, rawDescription: '스타벅스 판교' },
        { ruleId: rule.id, rawDescription: '스타벅스 분당' },
        { ruleId: 'unknown', rawDescription: 'x' },
      ],
      '2026-10-02T00:00:00.000Z'
    );
    expect(file.categoryRules[0]!.hits).toBe(0);
    expect(next.categoryRules[0]).toMatchObject({
      hits: 5,
      lastHitAt: '2026-10-02T00:00:00.000Z',
      examples: ['스타벅스 강남', '스타벅스 역삼', '스타벅스 판교'],
    });
    expect(recordHits(file, [])).toBe(file);
  });

  it('실명 가림은 aliases 키·insiders·규칙 예시·결정 로그 sample에 모두 적용된다', () => {
    const rule = containsRule('박말순', '용돈', { examples: ['박말순 이체', '김영희 송금'] });
    const file = rulesWith({
      aliases: { 박말순: '어머니', 김영희: '아내' },
      insiders: ['김영희', '미등록'],
      categoryRules: [rule],
      decisions: [
        {
          key: normalize('김영희 송금'),
          sample: '김영희 송금',
          category: '용돈',
          count: 2,
          lastAt: '2026-10-01T00:00:00.000Z',
          lastBatchId: 'b1',
        },
      ],
    });
    const masked = maskAliases(file);
    expect(masked.aliases).toEqual({ '<실명 1>': '어머니', '<실명 2>': '아내' });
    expect(masked.insiders).toEqual(['<실명 2>', '<실명>']);
    expect(masked.categoryRules[0]!.examples).toEqual(['<실명 1> 이체', '<실명 2> 송금']);
    expect(masked.decisions[0]!.sample).toBe('<실명 2> 송금');
    expect(JSON.stringify(masked)).not.toMatch(/박말순|김영희/);
  });
});
