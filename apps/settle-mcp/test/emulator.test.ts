import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import { createFirebaseClient } from '../src/firebase/client';
import {
  createKeyValuePersistence,
  type KeyValueStorage,
} from '../src/firebase/keyring-persistence';
import { SessionManager } from '../src/firebase/session';
import { JsonFileStore } from '../src/store/json-store';
import { normalize } from '../src/core/fingerprint';
import { commitBatch } from '../src/tools/commit-batch';
import { reviewPlaybookTool } from '../src/tools/review-playbook';
import { saveRule } from '../src/tools/save-rule';
import { setCategory } from '../src/tools/set-category';
import { CategoryCache, type ToolDeps } from '../src/tools/shared';
import { stageTransactions } from '../src/tools/stage-transactions';
import { undoBatch } from '../src/tools/undo-batch';

/**
 * Firebase 에뮬레이터 통합 테스트 (docs/09-settle-mcp.md §9.2).
 * `pnpm exec firebase emulators:start --only auth,firestore --project uandi-test` 위에서
 * UANDI_SETTLE_E2E=1 로 실행한다. 실제 cashbook-core + 실제 Firestore 보안 규칙 + 커스텀 토큰 로그인.
 */
const ENABLED = process.env.UANDI_SETTLE_E2E === '1';

const PROJECT = 'uandi-test';
const FIRESTORE = process.env.FIRESTORE_EMULATOR_HOST ?? 'localhost:8080';
const UID = `settle-e2e-${Date.now()}`;
const COUPLE_ID = `couple-e2e-${Date.now()}`;

/** 에뮬레이터 REST — Bearer owner 는 규칙을 우회한다 (시드 전용) */
async function seedDoc(path: string, fields: Record<string, unknown>) {
  const url = `http://${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { authorization: 'Bearer owner', 'content-type': 'application/json' },
    body: JSON.stringify({ fields: toFields(fields) }),
  });
  if (!res.ok) throw new Error(`seed ${path} failed: ${res.status} ${await res.text()}`);
}

function toFields(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = toValue(v);
  return out;
}
function toValue(v: unknown): unknown {
  if (v === null) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number')
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  return { mapValue: { fields: toFields(v as Record<string, unknown>) } };
}

/** Auth 에뮬레이터는 서명 없는 커스텀 토큰을 받는다 */
function unsignedCustomToken(uid: string): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
    iss: 'firebase-auth-emulator@example.com',
    sub: 'firebase-auth-emulator@example.com',
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    uid,
    iat: now,
    exp: now + 3600,
  })}.`;
}

/**
 * 키체인 대역. Firebase는 퍼시스턴스 키 끝에 앱 이름을 붙이는데(실행마다 [DEFAULT]라 실제론 같다),
 * 테스트는 한 프로세스에서 앱 이름을 달리 해야 하므로 그 접미사를 지워 "같은 PC의 다음 실행"을 흉내 낸다.
 */
class MemoryStorage implements KeyValueStorage {
  map = new Map<string, string>();
  private norm(k: string) {
    return k.replace(/:emu-\d+$/, ':[DEFAULT]');
  }
  getItem(k: string) {
    return this.map.get(this.norm(k)) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(this.norm(k), v);
  }
  removeItem(k: string) {
    this.map.delete(this.norm(k));
  }
}

describe.skipIf(!ENABLED)('에뮬레이터 통합', () => {
  let dir: string;
  const storage = new MemoryStorage();
  const config = loadConfig({ UANDI_SETTLE_EMULATOR: '1', UANDI_WEB_URL: 'http://web.test' });
  const fakeFetch = async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { code: string };
    if (body.code !== 'ABCD2345')
      return new Response(JSON.stringify({ error: 'CODE_INVALID' }), { status: 400 });
    return new Response(JSON.stringify({ customToken: unsignedCustomToken(UID) }), { status: 200 });
  };
  let session: SessionManager;
  let deps: ToolDeps;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'settle-emu-'));
    await seedDoc(`couples/${COUPLE_ID}`, { memberUids: [UID, 'partner'], createdAt: new Date() });
    await seedDoc(`users/${UID}`, { uid: UID, coupleId: COUPLE_ID, displayName: 'e2e' });
    const cat = (name: string, group: string, subGroup: string, sortOrder: number) => ({
      coupleId: COUPLE_ID,
      group,
      subGroup,
      name,
      icon: 'x',
      color: '#000000',
      isDefault: true,
      sortOrder,
      parentCategoryId: null,
      description: '',
      examples: [],
      createdAt: new Date(),
    });
    await seedDoc(
      `couples/${COUPLE_ID}/cashbookCategories/c-food`,
      cat('식비', 'expense', 'variable_common', 1)
    );
    await seedDoc(
      `couples/${COUPLE_ID}/cashbookCategories/c-etc`,
      cat('기타', 'expense', 'variable_common', 2)
    );
    // 앱에서 이미 기록된 내역 1건 (중복 대조 대상)
    await seedDoc(`couples/${COUPLE_ID}/cashbookEntries/existing-1`, {
      coupleId: COUPLE_ID,
      createdBy: 'partner',
      type: 'expense',
      amount: 12000,
      category: '식비',
      description: '이마트',
      date: new Date('2026-09-05T00:00:00+09:00'),
      createdAt: new Date(),
    });

    const fb = createFirebaseClient(config, createKeyValuePersistence(storage), 'emu-1');
    session = new SessionManager(fb.auth, fb.db, config, fakeFetch);
    deps = {
      store: new JsonFileStore(join(dir, 'staged.json')),
      rulesPath: join(dir, 'rules.json'),
      session,
      categories: new CategoryCache(),
      exposeAliasesInResource: true,
    };
  }, 30_000);

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('연결 코드 교환 → 커스텀 토큰 로그인 → coupleId 해석, 잘못된 코드는 CONNECT_FAILED', async () => {
    await expect(session.connect('ZZZZ-9999')).rejects.toMatchObject({ code: 'CONNECT_FAILED' });
    const me = await session.connect('ABCD-2345');
    expect(me).toEqual({ uid: UID, coupleId: COUPLE_ID });
    // 퍼시스턴스(키체인 대역)에 로그인 상태가 남는다
    expect([...storage.map.keys()].some((k) => k.startsWith('firebase:authUser'))).toBe(true);
  });

  it('새 프로세스(새 auth 인스턴스)가 같은 저장소에서 로그인을 복원한다', async () => {
    const fb2 = createFirebaseClient(config, createKeyValuePersistence(storage), 'emu-2');
    const restored = new SessionManager(fb2.auth, fb2.db, config, fakeFetch);
    expect(await restored.current()).toEqual({ uid: UID, coupleId: COUPLE_ID });
  });

  it('스테이징은 실제 내역과 대조하고, 커밋은 규칙 적용본만 쓰며, 되돌리기는 그 문서만 지운다', async () => {
    await (
      await import('../src/tools/save-rule')
    ).saveRule(deps, {
      rule: { kind: 'alias', realName: '홍길동', alias: '처형' },
    });
    const staged = await stageTransactions(deps, {
      label: 'e2e',
      source: { kind: 'account' },
      transactions: [
        {
          date: '2026-09-05',
          amount: 12000,
          type: 'expense',
          description: '이마트 성수',
          category: '식비',
        },
        {
          date: '2026-09-06',
          amount: 4500,
          type: 'expense',
          description: '스타벅스',
          category: '식비',
        },
        {
          date: '2026-09-07',
          amount: 30000,
          type: 'expense',
          description: '홍길동 급히 빌려준 돈',
          category: '기타',
        },
      ],
    });
    expect(staged.summary).toMatchObject({ pending: 2, duplicate: 1, transfer: 0, ignored: 0 });
    expect(staged.needsAttention.find((r) => r.status === 'duplicate')!.duplicateOf).toBe(
      'existing-1'
    );

    const dry = await commitBatch(deps, { batchId: staged.batchId, dryRun: true });
    expect(dry.wouldCommit).toBe(2);

    const committed = await commitBatch(deps, { batchId: staged.batchId });
    expect(committed.committed).toBe(2);

    const s = await session.require();
    const written = await s.gateway.getExistingEntries('2026-09-01', '2026-09-30');
    expect(written).toHaveLength(3); // 기존 1 + 새 2
    const creators = await Promise.all(
      committed.entryIds.map((id) => s.gateway.getEntryCreator(id))
    );
    expect(creators).toEqual([UID, UID]);

    // 실명이 치환돼 저장됐는지 — Firestore 문서를 직접 읽는다
    const { getEntry } = await import('@uandi/cashbook-core');
    const fb = createFirebaseClient(config, createKeyValuePersistence(storage), 'emu-3');
    await fb.auth.authStateReady();
    const docs = await Promise.all(committed.entryIds.map((id) => getEntry(fb.db, COUPLE_ID, id)));
    expect(docs.map((d) => d!.description).sort()).toEqual(['스타벅스', '처형 급히 빌려준 돈']);

    const undone = await undoBatch(deps, { batchId: staged.batchId });
    expect(undone).toMatchObject({ deleted: 2, notFound: [], skippedForeign: [] });
    expect(await s.gateway.getExistingEntries('2026-09-01', '2026-09-30')).toHaveLength(1);
    expect(await s.gateway.getEntryCreator('existing-1')).toBe('partner');
  }, 30_000);

  it('두 달 연속 결산 — 인터뷰 → 손으로 고침 → 다음 달 지난 결정 제안 → 승격 → 셋째 달 규칙 적용 (§11.8)', async () => {
    const tx = (date: string, amount: number, description: string, category: string | null) => ({
      date,
      amount,
      type: 'expense' as const,
      description,
      category,
    });

    // 0) 첫 결산 인터뷰 — 아내 이름 등록(원칙 3), 나머지는 기본
    const interview = await saveRule(deps, {
      rule: {
        kind: 'interview',
        answers: {
          cardPayment: { choice: 'byCard' },
          partnerName: { names: [{ realName: '김영희', alias: '아내' }] },
          thirdParty: { choice: 'skip' },
          cashRefund: { choices: ['skip'] },
        },
      },
    });
    expect(interview.rules.interview.completedAt).toBeTruthy();
    expect(interview.rules.insiders).toEqual(['김영희']);
    expect(interview.warnings).toEqual([]);

    // 1) 첫 달: 이디야는 카테고리 없이 들어와 손으로 식비. 아내에게 보낸 돈은 패턴 없이도 송금 보류
    const m1 = await stageTransactions(deps, {
      label: '2026-09 KB국민',
      source: { kind: 'account', name: 'KB국민' },
      transactions: [
        tx('2026-09-10', 4000, '이디야 커피', null),
        tx('2026-09-11', 50000, '김영희', null),
      ],
    });
    expect(m1.playbookDigest).toMatchObject({ interviewDone: true, insiders: 1, categoryRules: 0 });
    const m1Rows = await deps.store.listStaged(m1.batchId);
    const wife = m1Rows.find((r) => r.amount === 50000)!;
    expect(wife).toMatchObject({
      status: 'transfer',
      statusReason: 'transfer:insider:아내',
      description: '아내',
    });
    const ediya1 = m1Rows.find((r) => r.amount === 4000)!;
    expect(m1.needsAttention.map((r) => r.id)).toEqual([wife.id, ediya1.id]); // 금액 큰 순
    expect(m1.suggestions.map((s) => s.kind)).toEqual(['bigUnruled']); // 결정 로그가 비어 있으니 큰 금액만

    const set1 = await setCategory(deps, {
      batchId: m1.batchId,
      changes: [{ id: ediya1.id, category: '식비' }],
    });
    expect(set1.promotable).toEqual([]); // 1회
    const c1 = await commitBatch(deps, { batchId: m1.batchId });
    expect(c1.committed).toBe(1);
    expect(c1.retrospective).toMatchObject({
      byCategorySource: { rule: 0, llm: 0, user: 1 },
      userOverrides: 1,
      rulesSavedDuringBatch: 0,
      principlesTouched: [3], // 송금 보류가 있었다
    });

    // 2) 둘째 달: 같은 적요가 들어오면 "지난달엔 식비로" 제안이 붙는다. 손으로 다시 식비 → 승격 후보
    const m2 = await stageTransactions(deps, {
      label: '2026-10 KB국민',
      source: { kind: 'account', name: 'KB국민' },
      transactions: [tx('2026-10-10', 4500, '이디야커피', null)],
    });
    const past = m2.suggestions.filter((s) => s.kind === 'pastDecision');
    expect(past).toHaveLength(1);
    expect(past[0]).toMatchObject({ category: '식비', count: 1 });
    const ediya2 = (await deps.store.listStaged(m2.batchId))[0]!;
    expect(ediya2.suggestionIds).toContain(past[0]!.id);

    const set2 = await setCategory(deps, {
      batchId: m2.batchId,
      changes: [{ id: ediya2.id, category: '식비' }],
    });
    expect(set2.promotable).toEqual([
      { key: normalize('이디야 커피'), sample: '이디야커피', category: '식비', count: 2 },
    ]);
    const dry2 = await commitBatch(deps, { batchId: m2.batchId, dryRun: true });
    expect(dry2.retrospective.promotable[0]).toMatchObject({
      kind: 'promote',
      rowIds: [ediya2.id],
    });

    const promoted = await saveRule(deps, {
      rule: { kind: 'promote', key: '이디야 커피', category: '식비', rationale: '커피는 식비' },
    });
    expect(promoted.rules.decisions).toEqual([]);
    const c2 = await commitBatch(deps, { batchId: m2.batchId });
    expect(c2.committed).toBe(1);
    expect(c2.retrospective.rulesSavedDuringBatch).toBe(1);
    expect(c2.retrospective.promotable).toEqual([]);

    // 3) 셋째 달: 규칙이 적용된다 — 손댈 것이 없다
    const m3 = await stageTransactions(deps, {
      label: '2026-11 KB국민',
      source: { kind: 'account', name: 'KB국민' },
      transactions: [
        tx('2026-11-10', 4200, '이디야 커피 판교점', null),
        tx('2026-11-12', 4000, '이디야 커피', null),
      ],
    });
    const m3Rows = await deps.store.listStaged(m3.batchId);
    expect(m3Rows.find((r) => r.amount === 4000)).toMatchObject({
      category: '식비',
      categorySource: 'rule',
      appliedRuleId: promoted.savedId,
    });
    expect(m3Rows.find((r) => r.amount === 4200)!.category).toBeNull(); // exact 규칙은 지점명이 붙으면 안 맞는다
    expect(m3.needsAttention).toHaveLength(1);

    // 점검: 승격 규칙에 적용 이력이 남고, 인터뷰 기준 넷이 보인다
    const review = await reviewPlaybookTool(deps, {});
    const rule = review.digest.categoryRules;
    expect(rule).toBe(1);
    expect(review.principles).toHaveLength(4);
    expect(review.noRationale).toEqual([]);
    const onDisk = (await import('node:fs/promises')).readFile;
    const file = JSON.parse(await onDisk(deps.rulesPath, 'utf8')) as {
      categoryRules: { id: string; hits: number; examples: string[] }[];
    };
    expect(file.categoryRules[0]).toMatchObject({
      id: promoted.savedId,
      hits: 1,
      // promote 때 결정 sample이 첫 예시로, 셋째 달 적용 때 원문이 둘째 예시로
      examples: ['이디야커피', '이디야 커피'],
    });

    // 정리 — 두 달치 되돌리기
    expect((await undoBatch(deps, { batchId: m1.batchId })).deleted).toBe(1);
    expect((await undoBatch(deps, { batchId: m2.batchId })).deleted).toBe(1);
  }, 60_000);

  it('다른 커플 경로에는 보안 규칙이 쓰기를 거절한다', async () => {
    const { createFirestoreGateway } = await import('../src/firebase/gateway');
    const fb = createFirebaseClient(config, createKeyValuePersistence(storage), 'emu-4');
    await fb.auth.authStateReady();
    const foreign = createFirestoreGateway(fb.db, 'someone-elses-couple', UID);
    await expect(
      foreign.addEntries([
        { type: 'expense', amount: 1, category: '식비', description: 'x', date: '2026-09-01' },
      ])
    ).rejects.toThrow();
  });
});
