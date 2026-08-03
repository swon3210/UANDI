/**
 * App Store 심사용 데모 계정 가계부 시드 (프로덕션 uandi-55ee4)
 *
 * 리뷰어가 로그인하는 데모 계정(songwon3210)의 커플 가계부에 "지금(now) 기준" 현실적
 * 거래를 채워, 로그인 직후 대시보드(주간/월간/연간)·내역·현금흐름이 꽉 차 보이게 한다.
 * (대시보드는 couples/{coupleId}/cashbookEntries 원거래를 날짜범위로 읽어 클라이언트 집계 →
 *  요약문서 불필요, 거래만 넣으면 됨. 기본 화면은 "이번 주".)
 *
 * 멱등: 이 스크립트가 넣는 문서엔 { _seed: true } 마커가 붙는다. --execute 시 기존 _seed 문서를
 * 먼저 지우고 now 기준으로 다시 깐다 → 재제출 직전 다시 돌리면 날짜가 항상 신선.
 *
 * 인증: apps/web/.env.local 의 FIREBASE_SERVICE_ACCOUNT_KEY (uandi-55ee4). setup-env.sh 로 링크됨.
 *
 * 사용:
 *   node scripts/seed-demo-cashbook.mjs             # dry-run (계정 조회 + 계획만, 쓰기 X)
 *   node scripts/seed-demo-cashbook.mjs --execute   # 실제 시드
 *   DEMO_EMAIL=... node scripts/seed-demo-cashbook.mjs  # 데모 이메일 지정
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const EXECUTE = process.argv.includes('--execute');
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'songwon3210@gmail.com';
const EXPECTED_COUPLE = 'BgVs9JcaojIYsRjvXM6h'; // 메모리상 데모 커플(참고·교차확인용)

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

function loadServiceAccount() {
  const envPath = join(REPO_ROOT, 'apps', 'web', '.env.local');
  const content = readFileSync(envPath, 'utf8');
  const line = content.split('\n').find((l) => l.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));
  if (!line) throw new Error('apps/web/.env.local 에 FIREBASE_SERVICE_ACCOUNT_KEY 가 없습니다.');
  let raw = line.slice('FIREBASE_SERVICE_ACCOUNT_KEY='.length).trim();
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
    raw = raw.slice(1, -1);
  }
  return JSON.parse(raw);
}

const sa = loadServiceAccount();
initializeApp({ credential: cert(sa), projectId: 'uandi-55ee4' });
const db = getFirestore();
const auth = getAuth();

// ── 데모 계정 → uid / coupleId / members ──────────────────────────────────────
async function resolveDemo() {
  let uid;
  try {
    uid = (await auth.getUserByEmail(DEMO_EMAIL)).uid;
  } catch {
    const q = await db.collection('users').where('email', '==', DEMO_EMAIL).limit(1).get();
    if (q.empty) throw new Error(`데모 유저를 찾을 수 없습니다: ${DEMO_EMAIL}`);
    uid = q.docs[0].id;
  }
  const userSnap = await db.doc(`users/${uid}`).get();
  const coupleId = userSnap.get('coupleId');
  if (!coupleId) throw new Error(`데모 유저(${uid})에 coupleId 가 없습니다(커플 미연결).`);
  const coupleSnap = await db.doc(`couples/${coupleId}`).get();
  const members = coupleSnap.get('memberUids') || [uid];
  return { uid, coupleId, members };
}

// ── 날짜 헬퍼 (now 기준) ───────────────────────────────────────────────────────
const now = new Date();
const ts = (d) => Timestamp.fromDate(d);
const atDay = (year, monthIdx, day, hour = 12, min = 0) =>
  new Date(year, monthIdx, day, hour, min, 0, 0);
function clampDay(year, monthIdx, day) {
  const last = new Date(year, monthIdx + 1, 0).getDate();
  return Math.min(day, last);
}
const rand = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const money = (min, max) => Math.round(rand(min, max) / 100) * 100;

// ── 카테고리 풀 (기본 카테고리 이름/그룹과 일치) ───────────────────────────────
const VAR = [
  { cat: '식비', type: 'expense', min: 7000, max: 54000, desc: ['점심', '장보기', '배달', '마트', '저녁', '편의점'] },
  { cat: '데이트', type: 'expense', min: 9000, max: 62000, desc: ['카페', '영화', '디저트', '브런치'] },
  { cat: '교통', type: 'expense', min: 1500, max: 33000, desc: ['지하철', '버스', '택시', '주유'] },
  { cat: '소모품', type: 'expense', min: 6000, max: 39000, desc: ['생필품', '세제', '휴지', '주방용품'] },
  { cat: '병원', type: 'expense', min: 5000, max: 58000, desc: ['병원', '약국', '치과'] },
  { cat: '사회생활', type: 'expense', min: 14000, max: 72000, desc: ['회식', '팀 점심', '모임'] },
  { cat: '자기계발', type: 'expense', min: 11000, max: 46000, desc: ['책', '인강', '자격증'] },
];
const FLEX = [
  { cat: '여가', type: 'flex', min: 12000, max: 58000, desc: ['영화', '공연', '게임'] },
  { cat: '소비', type: 'flex', min: 15000, max: 92000, desc: ['쇼핑', '취미용품'] },
];

const entries = [];
function push(date, type, category, amount, description, createdBy) {
  entries.push({ createdBy, type, amount, category, description, date });
}

function seedMonth(year, monthIdx, uidA, uidB, { dense = false } = {}) {
  // 정기 수입/고정 지출
  push(atDay(year, monthIdx, clampDay(year, monthIdx, 25), 9), 'income', '정기급여', 3_300_000, '월급', uidA);
  push(atDay(year, monthIdx, clampDay(year, monthIdx, 25), 9), 'income', '정기급여', 2_900_000, '월급', uidB);
  push(atDay(year, monthIdx, 1, 9), 'expense', '월세', 850_000, '월세', uidA);
  push(atDay(year, monthIdx, clampDay(year, monthIdx, 16), 10), 'expense', '공과금', money(88_000, 132_000), '관리비·공과금', uidB);
  push(atDay(year, monthIdx, 12, 10), 'expense', '보험', 141_000, '보험료', uidA);
  // 변동 지출 (월 12~18건)
  const count = dense ? 18 : 13;
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  for (let i = 0; i < count; i++) {
    const day = 1 + Math.floor(rand(0, lastDay));
    const p = pick(VAR);
    const by = Math.random() < 0.5 ? uidA : uidB;
    push(atDay(year, monthIdx, clampDay(year, monthIdx, day), 8 + Math.floor(rand(0, 12))), p.type, p.cat, money(p.min, p.max), pick(p.desc), by);
  }
  // Flex 2~3건
  for (let i = 0; i < (dense ? 3 : 2); i++) {
    const day = 1 + Math.floor(rand(0, lastDay));
    const p = pick(FLEX);
    const by = Math.random() < 0.5 ? uidA : uidB;
    push(atDay(year, monthIdx, clampDay(year, monthIdx, day), 15), p.type, p.cat, money(p.min, p.max), pick(p.desc), by);
  }
  // 비정기 수입 가끔
  if (Math.random() < 0.6) {
    push(atDay(year, monthIdx, clampDay(year, monthIdx, 8 + Math.floor(rand(0, 15))), 14), 'income', '부업', money(120_000, 480_000), pick(['외주', '강의', '중고거래']), Math.random() < 0.5 ? uidA : uidB);
  }
}

function seedCurrentWeek(uidA, uidB) {
  // 이번 주(일요일 시작) ~ 오늘: 기본 대시보드(주간)가 반드시 차게 매일 1~2건.
  const sow = new Date(now);
  sow.setDate(sow.getDate() - sow.getDay());
  sow.setHours(0, 0, 0, 0);
  const today = new Date(now);
  for (let d = new Date(sow); d <= today; d.setDate(d.getDate() + 1)) {
    const n = 1 + (Math.random() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const p = Math.random() < 0.8 ? pick(VAR) : pick(FLEX);
      const by = Math.random() < 0.5 ? uidA : uidB;
      const hour = 8 + Math.floor(rand(0, 12));
      push(new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0, 0, 0), p.type, p.cat, money(p.min, p.max), pick(p.desc), by);
    }
  }
}

async function main() {
  console.log(`대상 이메일: ${DEMO_EMAIL} · mode: ${EXECUTE ? 'EXECUTE(쓰기)' : 'DRY-RUN(조회만)'}`);
  const { uid, coupleId, members } = await resolveDemo();
  const uidA = members[0];
  const uidB = members[1] || members[0];
  console.log(`demo uid=${uid}`);
  console.log(`coupleId=${coupleId} ${coupleId === EXPECTED_COUPLE ? '(메모리 기대값 일치)' : '(메모리 기대값과 다름 — 조회값 사용)'}`);
  console.log(`members=${JSON.stringify(members)} → A=${uidA} B=${uidB}`);

  const entriesCol = db.collection(`couples/${coupleId}/cashbookEntries`);
  const existingSnap = await entriesCol.get();
  const seededDocs = existingSnap.docs.filter((d) => d.get('_seed') === true);
  console.log(`기존 거래=${existingSnap.size}건 (그중 _seed=${seededDocs.length}건)`);

  // 거래 생성: 이번 주(dense) + 이번 달 + 직전 2개월
  const y = now.getFullYear();
  const m = now.getMonth();
  seedCurrentWeek(uidA, uidB);
  seedMonth(y, m, uidA, uidB, { dense: true }); // 이번 달
  seedMonth(m - 1 < 0 ? y - 1 : y, (m - 1 + 12) % 12, uidA, uidB);
  seedMonth(m - 2 < 0 ? y - 1 : y, (m - 2 + 12) % 12, uidA, uidB);

  // 미래(현금흐름 예측용) 소량
  for (let i = 0; i < 4; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + 3 + Math.floor(rand(0, 40)));
    const p = pick(VAR);
    push(d, p.type, p.cat, money(p.min, p.max), pick(p.desc), Math.random() < 0.5 ? uidA : uidB);
  }

  const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const expense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const sow = new Date(now);
  sow.setDate(sow.getDate() - sow.getDay());
  sow.setHours(0, 0, 0, 0);
  const thisWeek = entries.filter((e) => e.date >= sow && e.date <= now).length;
  console.log(
    `\n생성할 거래=${entries.length}건 (이번주 ${thisWeek}건) · 수입 ${income.toLocaleString()}원 · 지출 ${expense.toLocaleString()}원`
  );

  if (!EXECUTE) {
    console.log('\n--dry-run: 쓰기 안 함. 확인 후 --execute 로 다시 실행하세요.');
    return;
  }

  // 1) 기존 _seed 거래 삭제 (멱등)
  if (seededDocs.length) {
    let batch = db.batch();
    let n = 0;
    for (const d of seededDocs) {
      batch.delete(d.ref);
      if (++n % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    await batch.commit();
    console.log(`기존 _seed 거래 ${seededDocs.length}건 삭제`);
  }

  // 2) 새 거래 쓰기
  let batch = db.batch();
  let n = 0;
  for (const e of entries) {
    const ref = entriesCol.doc();
    batch.set(ref, {
      coupleId,
      createdBy: e.createdBy,
      type: e.type,
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: ts(e.date),
      createdAt: ts(now),
      _seed: true,
    });
    if (++n % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`거래 ${entries.length}건 시드 완료`);

  // 3) 현금흐름 설정 (없으면 현금흐름 탭이 빈 설정화면 → 채워둠)
  const initA = 3_500_000;
  const initB = 2_800_000;
  const initDate = new Date(now);
  initDate.setDate(initDate.getDate() - 35);
  await db.doc(`couples/${coupleId}/meta/cashflow`).set(
    {
      coupleId,
      initialCash: initA + initB,
      initialCashByUid: { [uidA]: initA, [uidB]: initB },
      initialDate: ts(initDate),
      paydays: [],
      updatedAt: ts(now),
      _seed: true,
    },
    { merge: true }
  );
  console.log('meta/cashflow 설정 완료 (현금흐름 탭 활성)');
  console.log('\n✅ 시드 완료. 데모 계정으로 로그인 시 대시보드/내역/현금흐름이 채워집니다.');
}

main().catch((e) => {
  console.error('\n✗ 실패:', e.message);
  process.exit(1);
});
