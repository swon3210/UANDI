import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createExistingMatcher, dedupeWithinBatch, duplicateScope } from '../src/core/dedupe';
import { enforceBeforeCommit } from '../src/core/enforce';
import { SettleError } from '../src/core/errors';
import { fingerprint, normalize } from '../src/core/fingerprint';
import {
  applyAliases,
  applyRules,
  compilePattern,
  compileRules,
  defaultRules,
  loadRules,
  writeRules,
} from '../src/core/rules';
import type { StagedTransaction } from '../src/core/types';

describe('normalize / fingerprint', () => {
  it('NFC·공백·구두점·대소문자를 무시해 같은 키를 만든다', () => {
    const decomposed = '스타벅스'.normalize('NFD');
    expect(normalize(decomposed)).toBe(normalize('스타벅스'));
    expect(normalize('스타벅스 코리아')).toBe(normalize('스타벅스-코리아'));
    expect(normalize('Starbucks KR')).toBe(normalize('starbucks.kr'));
  });

  it('같은 날·금액이라도 적요가 다르면 다른 지문, 같은 적요를 다시 넣으면 같은 지문', () => {
    const a = fingerprint('2026-09-10', 5000, '스타벅스');
    const b = fingerprint('2026-09-10', 5000, '이디야');
    const c = fingerprint('2026-09-10', 5000, '스타 벅스');
    expect(a).not.toBe(b);
    expect(a).toBe(c);
    expect(a).toHaveLength(16);
  });
});

describe('dedupe', () => {
  it('배치 내 지문 충돌은 뒤에 온 것을 버린다', () => {
    const rows = [
      { fingerprint: 'a', n: 1 },
      { fingerprint: 'b', n: 2 },
      { fingerprint: 'a', n: 3 },
    ];
    const { kept, dropped } = dedupeWithinBatch(rows);
    expect(kept.map((r) => r.n)).toEqual([1, 2]);
    expect(dropped.map((r) => r.n)).toEqual([3]);
  });

  it('기존 내역과는 날짜+금액만 비교하고(적요 무시), 하루 차이는 중복이 아니다', () => {
    const matcher = createExistingMatcher([{ id: 'e1', date: '2026-09-10', amount: 5000 }]);
    expect(matcher.take({ date: '2026-09-11', amount: 5000 })).toBeNull();
    expect(matcher.take({ date: '2026-09-10', amount: 5000 })).toBe('e1');
    // 한 번 매칭된 기존 내역은 소비된다 — 같은 날 같은 금액 2건 중 하나만 중복
    expect(matcher.take({ date: '2026-09-10', amount: 5000 })).toBeNull();
  });

  it('대조 범위는 최소−1일 ~ 최대+1일', () => {
    expect(duplicateScope(['2026-09-10', '2026-09-01', '2026-09-30'])).toEqual({
      start: '2026-08-31',
      end: '2026-10-01',
    });
    expect(duplicateScope([])).toBeNull();
  });
});

describe('rules', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'settle-rules-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('파일이 없으면 기본 규칙을 만들어 저장한다', async () => {
    const path = join(dir, 'rules.json');
    const rules = await loadRules(path, 'c1');
    expect(rules.file.coupleId).toBe('c1');
    expect(rules.ignore).toHaveLength(1);
    expect(JSON.parse(await readFile(path, 'utf8')).version).toBe(1);
  });

  it('깨진 JSON·형식 오류·다른 커플 파일은 RULES_INVALID', async () => {
    const path = join(dir, 'rules.json');
    await writeFile(path, '{ not json');
    await expect(loadRules(path, 'c1')).rejects.toMatchObject({ code: 'RULES_INVALID' });

    await writeFile(
      path,
      JSON.stringify({ version: 1, coupleId: 'c1', exactCategory: {}, ignore: 'x' })
    );
    await expect(loadRules(path, 'c1')).rejects.toMatchObject({ code: 'RULES_INVALID' });

    await writeRules(path, defaultRules('other-couple'));
    await expect(loadRules(path, 'c1')).rejects.toMatchObject({ code: 'RULES_INVALID' });
  });

  it('쓰기는 임시 파일을 남기지 않는다', async () => {
    const path = join(dir, 'rules.json');
    await writeRules(path, defaultRules('c1'));
    expect(await readdir(dir)).toEqual(['rules.json']);
  });

  it('빈 문자열에 매칭되는 패턴과 잘못된 정규식은 거절한다', () => {
    expect(() => compilePattern('.*')).toThrow(SettleError);
    expect(() => compilePattern('(')).toThrow(SettleError);
    expect(() => compilePattern('a?')).toThrowError(/빈 문자열/);
    expect(compilePattern('이체')).toBeInstanceOf(RegExp);
  });

  it('기본 카드대금 규칙은 계좌 내역서의 지출에만 적용된다', () => {
    const rules = compileRules(defaultRules('c1'));
    const names = new Set(['식비']);
    const row = { rawDescription: '신한카드 대금', type: 'expense' as const, llmCategory: null };
    expect(applyRules(row, 'account', rules, names).status).toBe('ignored');
    expect(applyRules(row, 'card', rules, names).status).toBe('pending');
    expect(applyRules({ ...row, type: 'income' }, 'account', rules, names).status).toBe('pending');
  });

  it('별칭 치환은 부분 문자열도 잡고 긴 이름부터 치환한다', () => {
    const rules = compileRules({
      ...defaultRules('c1'),
      aliases: { 영희: '친구', 김영희: '어머니' },
    });
    expect(applyAliases('김영희님 이체', rules)).toBe('어머니님 이체');
    expect(applyAliases('영희 송금', rules)).toBe('친구 송금');
  });

  it('정확일치 규칙이 LLM 후보를 덮어쓰고, 목록에 없는 LLM 카테고리는 null', () => {
    const rules = compileRules({
      ...defaultRules('c1'),
      exactCategory: { [normalize('스타벅스 코리아')]: '구독' },
    });
    const names = new Set(['식비', '구독']);
    const hit = applyRules(
      { rawDescription: '스타벅스코리아', type: 'expense', llmCategory: '식비' },
      'card',
      rules,
      names
    );
    expect(hit.category).toBe('구독');
    expect(hit.categorySource).toBe('rule');

    const unknown = applyRules(
      { rawDescription: '이디야', type: 'expense', llmCategory: '없는카테고리' },
      'card',
      rules,
      names
    );
    expect(unknown.category).toBeNull();
    expect(unknown.categorySource).toBeNull();
  });

  it('송금 판정은 수입·지출 모두에 적용되고 requireKnownName이면 실명이 있어야 한다', () => {
    const base = defaultRules('c1');
    const loose = compileRules(base);
    const names = new Set<string>();
    expect(
      applyRules(
        { rawDescription: '홍길동 이체', type: 'income', llmCategory: null },
        'account',
        loose,
        names
      ).status
    ).toBe('transfer');

    const strict = compileRules({
      ...base,
      transfer: [{ pattern: '이체', requireKnownName: true }],
      aliases: { 홍길동: '처형' },
    });
    expect(
      applyRules(
        { rawDescription: '홍길동 이체', type: 'expense', llmCategory: null },
        'account',
        strict,
        names
      ).status
    ).toBe('transfer');
    expect(
      applyRules(
        { rawDescription: '회사 이체', type: 'expense', llmCategory: null },
        'account',
        strict,
        names
      ).status
    ).toBe('pending');
  });
});

describe('enforceBeforeCommit', () => {
  const row = (over: Partial<StagedTransaction>): StagedTransaction => ({
    id: 'r1',
    batchId: 'b1',
    fingerprint: 'f',
    date: '2026-09-10',
    amount: 5000,
    type: 'expense',
    rawDescription: '스타벅스',
    description: '스타벅스',
    category: '식비',
    categorySource: 'llm',
    status: 'pending',
    statusReason: null,
    duplicateOf: null,
    sourceHint: null,
    committedEntryId: null,
    createdAt: '2026-09-30T00:00:00.000Z',
    ...over,
  });
  const names = new Set(['식비']);

  it('별칭 잔존 → ALIAS_LEAK, 카테고리 없음 → MISSING_CATEGORY, 새 무시 규칙 → IGNORE_HIT', () => {
    const rules = compileRules({
      ...defaultRules('c1'),
      aliases: { 홍길동: '처형' },
      ignore: [{ pattern: '넷플릭스', reason: '구독은 따로' }],
    });
    // description은 별칭 규칙이 없던 시점에 만들어졌다고 가정 — 재치환으로 잡혀야 한다
    const leakFree = enforceBeforeCommit(
      [row({ id: 'a', rawDescription: '홍길동 이체', description: '홍길동 이체' })],
      'card',
      rules,
      names,
      []
    );
    expect(leakFree.blocked).toEqual([]);
    expect(leakFree.committable[0]!.description).toBe('처형 이체');

    // 치환 후에도 남는 경우: 별칭 값이 또 다른 실명 키를 포함하는 설정 오류
    const circular = compileRules({
      ...defaultRules('c1'),
      aliases: { 길동: '홍길동', 홍길동: '처형' },
    });
    const leak = enforceBeforeCommit(
      [row({ id: 'a', rawDescription: '길동 이체' })],
      'card',
      circular,
      names,
      []
    );
    expect(leak.blocked.map((b) => b.code)).toContain('ALIAS_LEAK');

    const res = enforceBeforeCommit(
      [
        row({ id: 'b', category: null }),
        row({ id: 'c', category: '없음' }),
        row({ id: 'd', rawDescription: '넷플릭스' }),
      ],
      'card',
      rules,
      names,
      []
    );
    expect(res.blocked.map((b) => [b.id, b.code])).toEqual([
      ['b', 'MISSING_CATEGORY'],
      ['c', 'MISSING_CATEGORY'],
      ['d', 'IGNORE_HIT'],
    ]);
  });

  it('재대조에서 새로 중복이 된 행은 막지 않고 빼기만 한다', () => {
    const rules = compileRules(defaultRules('c1'));
    const res = enforceBeforeCommit(
      [row({ id: 'a' }), row({ id: 'b', amount: 7000 })],
      'card',
      rules,
      names,
      [{ id: 'e1', date: '2026-09-10', amount: 5000 }]
    );
    expect(res.blocked).toEqual([]);
    expect(res.newlyDuplicate).toEqual([{ id: 'a', duplicateOf: 'e1' }]);
    expect(res.committable.map((r) => r.id)).toEqual(['b']);
  });
});
