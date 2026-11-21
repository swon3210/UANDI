/**
 * 의견 보내기(건의) 조회 — 프로덕션 uandi-55ee4 의 `feedback` 컬렉션을 읽기 전용으로 출력한다.
 *
 * 어드민 페이지(/admin)와 같은 데이터를 터미널에서 바로 보려는 용도. 쓰기는 하지 않는다.
 * 상태 변경(checked/resolved)은 어드민 페이지에서 한다.
 *
 * 인증: apps/web/.env.local 의 FIREBASE_SERVICE_ACCOUNT_KEY (seed-demo-cashbook.mjs 와 동일).
 *
 * 사용:
 *   node scripts/list-feedback.mjs                 # 미확인(new)만, 최신순 20건
 *   node scripts/list-feedback.mjs --all           # 상태 무관 전체
 *   node scripts/list-feedback.mjs --status resolved
 *   node scripts/list-feedback.mjs --type bug      # bug | idea | other
 *   node scripts/list-feedback.mjs --limit 50
 *   node scripts/list-feedback.mjs --id <feedbackId>   # 한 건 상세(스크린샷 서명 URL 포함)
 *   node scripts/list-feedback.mjs --json          # 기계가 읽기 좋은 JSON 배열
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// firebase-admin 은 apps/web 의존성이라 그쪽 node_modules 에서 해석한다.
const require = createRequire(join(REPO_ROOT, 'apps', 'web', 'package.json'));
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');

const TYPES = ['bug', 'idea', 'other'];
const STATUSES = ['new', 'checked', 'resolved'];
const TYPE_LABEL = { bug: '버그', idea: '아이디어', other: '기타' };
const STATUS_LABEL = { new: '미확인', checked: '확인함', resolved: '해결' };

// ── 인자 ──────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const opts = { status: 'new', type: null, limit: 20, id: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--all') opts.status = null;
    else if (a === '--status') opts.status = next();
    else if (a === '--type') opts.type = next();
    else if (a === '--limit') opts.limit = Number(next());
    else if (a === '--id') opts.id = next();
    else if (a === '--json') opts.json = true;
    else if (a === '--help' || a === '-h') {
      console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
      process.exit(0);
    } else throw new Error(`알 수 없는 인자: ${a}`);
  }
  if (opts.status && !STATUSES.includes(opts.status))
    throw new Error(`--status 는 ${STATUSES.join('|')} 중 하나여야 합니다.`);
  if (opts.type && !TYPES.includes(opts.type))
    throw new Error(`--type 은 ${TYPES.join('|')} 중 하나여야 합니다.`);
  if (!Number.isInteger(opts.limit) || opts.limit < 1 || opts.limit > 200)
    throw new Error('--limit 은 1~200 사이 정수여야 합니다.');
  return opts;
}

// ── 인증 ──────────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(REPO_ROOT, 'apps', 'web', '.env.local');
  const content = readFileSync(envPath, 'utf8');
  const get = (key) => {
    const line = content.split('\n').find((l) => l.startsWith(`${key}=`));
    if (!line) return null;
    let raw = line.slice(key.length + 1).trim();
    if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"')))
      raw = raw.slice(1, -1);
    return raw;
  };
  const sa = get('FIREBASE_SERVICE_ACCOUNT_KEY');
  if (!sa) throw new Error('apps/web/.env.local 에 FIREBASE_SERVICE_ACCOUNT_KEY 가 없습니다.');
  return { sa: JSON.parse(sa), bucket: get('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') };
}

// ── 조회 ──────────────────────────────────────────────────────────────────────
async function fetchItems(db, auth, opts) {
  const col = db.collection('feedback');
  let docs;
  if (opts.id) {
    const snap = await col.doc(opts.id).get();
    if (!snap.exists) throw new Error(`feedback/${opts.id} 문서가 없습니다.`);
    docs = [snap];
  } else {
    let q = col;
    if (opts.status) q = q.where('status', '==', opts.status);
    if (opts.type) q = q.where('type', '==', opts.type);
    const snap = await q.orderBy('createdAt', 'desc').limit(opts.limit).get();
    docs = snap.docs;
  }

  // 작성자 이메일·이름은 Auth 에서(어드민 API 와 같은 규칙), 없으면 null
  const uids = [...new Set(docs.map((d) => d.data().uid).filter(Boolean))];
  const authByUid = new Map();
  if (uids.length) {
    const { users } = await auth.getUsers(uids.map((uid) => ({ uid })));
    for (const u of users) authByUid.set(u.uid, u);
  }

  return docs.map((d) => {
    const x = d.data();
    const u = authByUid.get(x.uid);
    return {
      id: d.id,
      type: x.type,
      status: x.status,
      createdAt: x.createdAt?.toDate?.().toISOString() ?? null,
      statusUpdatedAt: x.statusUpdatedAt?.toDate?.().toISOString() ?? null,
      author: { uid: x.uid, email: u?.email ?? null, displayName: u?.displayName ?? null },
      contactEmail: x.contactEmail ?? null,
      coupleId: x.coupleId ?? null,
      screenshotPath: x.screenshotPath ?? null,
      context: x.context ?? null,
      content: x.content ?? '',
    };
  });
}

async function signedUrl(storage, bucketName, path) {
  if (!path || !bucketName) return null;
  try {
    const [url] = await storage
      .bucket(bucketName)
      .file(path)
      .getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
    return url;
  } catch {
    return null;
  }
}

// ── 출력 ──────────────────────────────────────────────────────────────────────
const fmtKst = (iso) => {
  if (!iso) return '-';
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
  return `${parts} KST`;
};

function printItem(item, { detail }) {
  const who = item.author.displayName
    ? `${item.author.displayName} <${item.author.email ?? '?'}>`
    : (item.author.email ?? item.author.uid);
  console.log(
    `[${STATUS_LABEL[item.status] ?? item.status}] [${TYPE_LABEL[item.type] ?? item.type}] ${fmtKst(item.createdAt)}  id=${item.id}`
  );
  console.log(`  작성자: ${who}` + (item.contactEmail ? `  (연락: ${item.contactEmail})` : ''));
  const c = item.context ?? {};
  console.log(
    `  환경: ${c.platform ?? '?'} · 앱 ${c.appVersion ?? '?'} · ${c.previousPath ?? '?'} · ${c.viewport ?? '?'}`
  );
  if (item.screenshotPath) console.log(`  스크린샷: ${item.screenshotUrl ?? item.screenshotPath}`);
  if (detail) {
    console.log(`  coupleId: ${item.coupleId ?? '-'}`);
    console.log(`  UA: ${c.userAgent ?? '-'}`);
    if (item.statusUpdatedAt) console.log(`  상태변경: ${fmtKst(item.statusUpdatedAt)}`);
  }
  console.log('  내용:');
  for (const line of item.content.split('\n')) console.log(`    ${line}`);
  console.log('');
}

// ── main ──────────────────────────────────────────────────────────────────────
let opts, sa, bucket;
try {
  opts = parseArgs(process.argv.slice(2));
  ({ sa, bucket } = loadEnv());
} catch (e) {
  console.error(`오류: ${e.message}`);
  process.exit(1);
}
initializeApp({ credential: cert(sa), projectId: 'uandi-55ee4' });
const db = getFirestore();
const auth = getAuth();

const items = await fetchItems(db, auth, opts);
if (opts.id) {
  items[0].screenshotUrl = await signedUrl(getStorage(), bucket, items[0].screenshotPath);
}

if (opts.json) {
  console.log(JSON.stringify(items, null, 2));
} else {
  const scope = opts.id
    ? `feedback/${opts.id}`
    : `${opts.status ? STATUS_LABEL[opts.status] : '전체'}${opts.type ? ` · ${TYPE_LABEL[opts.type]}` : ''}`;
  console.log(`# 건의 ${items.length}건 (${scope}, 최신순)\n`);
  if (items.length === 0) console.log('해당하는 건의가 없습니다.');
  for (const item of items) printItem(item, { detail: Boolean(opts.id) });

  if (!opts.id) {
    const newCount = (
      await db.collection('feedback').where('status', '==', 'new').count().get()
    ).data().count;
    console.log(`미확인(new) 총 ${newCount}건 · 상태 변경은 어드민 페이지(/admin)에서`);
  }
}
