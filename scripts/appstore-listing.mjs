/**
 * App Store Connect 스토어 등록정보(텍스트 + 카테고리 + 심사정보) 동기화 스크립트
 *
 * 빌드 제출(`eas submit`)에 쓰는 것과 동일한 App Store Connect API 키(.p8)로
 * ASC API(v1)를 호출해, 심사 제출 전에 채워야 하는 메타데이터를 한 번에 넣는다.
 *
 * 이 스크립트가 채우는 것:
 *   - 버전 현지화(ko): 설명 / 키워드 / 프로모션 텍스트 / 지원 URL / 마케팅 URL
 *   - 앱 정보 현지화(ko): 이름 / 부제(subtitle) / 개인정보처리방침 URL
 *   - 카테고리(기본/보조)
 *   - 심사 정보(App Review): 데모 계정 / 연락처 / 심사 노트
 *
 * 이 스크립트가 "안" 하는 것 (심사 UI에서 직접 해야 함):
 *   - 스크린샷 업로드 (iOS 6.9"/6.7" 규격 이미지 필요)
 *   - 연령 등급(Age Rating) 설문
 *   - App Privacy(데이터 수집) 설문  ← apps/mobile/store/data-safety.md 참고해 UI에서
 *   - Submit for Review (최종 제출)   ← 되돌리기 힘든 공개 행위라 의도적으로 제외
 *
 * 인증(모두 커밋된 값/파일에서 읽음 — 스크립트만 .p8을 읽고, 채팅/코드로 노출 안 됨):
 *   apps/mobile/eas.json 의 submit.production.ios 에서
 *     ascApiKeyId, ascApiKeyIssuerId, ascApiKeyPath(기본 ./asc-api-key.p8)
 *   를 읽는다. .p8 경로는 --key / ASC_API_KEY_PATH 로 덮어쓸 수 있다.
 *
 * 실행 시 넣어야 하는 값(민감정보는 env 로 — 채팅/repo 안 거침):
 *   ASC_DEMO_USER          심사용 데모 계정 이메일/아이디  (필수: 심사정보 채우려면)
 *   ASC_DEMO_PASSWORD      심사용 데모 계정 비밀번호        (필수: 심사정보 채우려면)
 *   ASC_CONTACT_FIRST      심사 연락처 이름                 (필수: 심사정보 채우려면)
 *   ASC_CONTACT_LAST       심사 연락처 성                   (필수: 심사정보 채우려면)
 *   ASC_CONTACT_PHONE      심사 연락처 전화                 (필수: 심사정보 채우려면)
 *   ASC_CONTACT_EMAIL      심사 연락처 이메일 (기본: swon3210@gmail.com)
 *   ASC_REVIEW_NOTES       심사 노트 (기본 문구 있음)
 *
 * 사용:
 *   node scripts/appstore-listing.mjs push --dry-run   # 미리보기 (반영 안 됨)
 *   ASC_DEMO_USER=... ASC_DEMO_PASSWORD=... ASC_CONTACT_FIRST=... \
 *   ASC_CONTACT_LAST=... ASC_CONTACT_PHONE=... \
 *     node scripts/appstore-listing.mjs push          # 실제 반영
 *   node scripts/appstore-listing.mjs push --skip-review   # 텍스트/카테고리만
 *
 * 사전 요구: Node 18+ (전역 fetch), .p8 을 apps/mobile/asc-api-key.p8 에 저장
 */
import crypto from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const MOBILE_DIR = join(REPO_ROOT, 'apps', 'mobile');
const LISTINGS_DIR = join(MOBILE_DIR, 'store', 'listings');
const RELEASE_NOTES_DIR = join(MOBILE_DIR, 'store', 'release-notes');
const API = 'https://api.appstoreconnect.apple.com';

// ── 설정 (필요하면 여기 상수 또는 위 env 로 조정) ─────────────────────────────
const CONFIG = {
  appAppleId: process.env.ASC_APP_ID || '6790130439', // App Store Connect 앱의 Apple ID
  locale: 'ko', // ASC 현지화 로케일 코드 (한국어)
  langDir: 'ko-KR', // 로컬 문구 폴더명 (Play와 공유)
  primaryCategory: process.env.ASC_PRIMARY_CATEGORY || 'FINANCE',
  secondaryCategory: process.env.ASC_SECONDARY_CATEGORY || 'LIFESTYLE',
  supportUrl: process.env.ASC_SUPPORT_URL || 'https://uandi-web.vercel.app',
  marketingUrl: process.env.ASC_MARKETING_URL || '',
  privacyPolicyUrl: process.env.ASC_PRIVACY_URL || 'https://uandi-web.vercel.app/privacy',
};

// 이 스크립트는 App Store(iOS) 전용이므로, 심사 노트도 iOS 앱에 실제 노출되는 기능
// (가계부만)으로 서술한다. iOS 네이티브에서는 사진첩/재테크/커뮤니티가 숨겨진다.
const DEFAULT_NOTES = [
  '말랑 가계부는 커플이 함께 쓰는 공동 가계부 앱입니다.',
  '',
  '로그인은 Google 또는 Apple 계정으로만 가능하여 리뷰어가 직접 계정을 만들 수 없으므로,',
  '심사용 데모 계정을 아래 "로그인 정보"에 제공합니다. 이 데모 계정에는 상대방 커플이',
  '이미 연결되어 있고 샘플 데이터가 들어 있어, 로그인 직후 가계부 기능(가계부 내역/',
  '대시보드/현금흐름/목표)을 바로 확인할 수 있습니다.',
  '',
  '"Apple로 계속하기" 버튼은 WebView 안의 웹 로그인 화면에서 Sign in with Apple(Firebase)',
  '으로 동작합니다.',
].join('\n');

// 텍스트 필드 ↔ 로컬 파일 매핑 (App Store 글자수 한도 기준)
const VERSION_FIELDS = [
  { key: 'description', file: 'full-description.txt', max: 4000, label: '설명', required: true },
  { key: 'keywords', file: 'keywords.txt', max: 100, label: '키워드', required: true },
  { key: 'promotionalText', file: 'short-description.txt', max: 170, label: '프로모션 텍스트' },
];
const APPINFO_FIELDS = [
  { key: 'name', file: 'title.txt', max: 30, label: '앱 이름', required: true },
  { key: 'subtitle', file: 'subtitle.txt', max: 30, label: '부제' },
];

// ── 인자 파싱 ────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = { dryRun: false, skipReview: false, whatsNew: false, key: null };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--') continue;
    else if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--skip-review') flags.skipReview = true;
    else if (a === '--whats-new') flags.whatsNew = true;
    else if (a === '--key') flags.key = rest[++i];
    else throw new Error(`알 수 없는 인자: ${a}`);
  }
  return { command, flags };
}

// ── 인증 (eas.json + .p8) ─────────────────────────────────────────────────────
function loadAuth(flags) {
  const easPath = join(MOBILE_DIR, 'eas.json');
  const ios = JSON.parse(readFileSync(easPath, 'utf8'))?.submit?.production?.ios;
  if (!ios?.ascApiKeyId || !ios?.ascApiKeyIssuerId) {
    throw new Error('eas.json 의 submit.production.ios 에서 ascApiKeyId/ascApiKeyIssuerId 를 찾을 수 없습니다.');
  }
  const keyPath =
    flags.key || process.env.ASC_API_KEY_PATH || resolve(MOBILE_DIR, ios.ascApiKeyPath || './asc-api-key.p8');
  if (!existsSync(keyPath)) {
    throw new Error(`ASC API 키(.p8)를 찾을 수 없습니다: ${keyPath}\n--key / ASC_API_KEY_PATH 로 경로를 지정하세요.`);
  }
  return { keyId: ios.ascApiKeyId, issuerId: ios.ascApiKeyIssuerId, keyPath };
}

function makeToken({ keyId, issuerId, keyPath }) {
  const privateKey = crypto.createPrivateKey(readFileSync(keyPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const payload = { iss: issuerId, iat: now, exp: now + 18 * 60, aud: 'appstoreconnect-v1' };
  const signingInput = `${b64(header)}.${b64(payload)}`;
  // ES256 은 JOSE(R||S) 서명 형식이어야 함 → dsaEncoding: 'ieee-p1363'
  const sig = crypto
    .sign('sha256', Buffer.from(signingInput), { key: privateKey, dsaEncoding: 'ieee-p1363' })
    .toString('base64url');
  return `${signingInput}.${sig}`;
}

// ── HTTP ─────────────────────────────────────────────────────────────────────
let TOKEN = '';
let DRY = false;

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const detail = (json.errors || [])
      .map((e) => `${e.title}: ${e.detail}${e.source ? ` (${JSON.stringify(e.source)})` : ''}`)
      .join('\n') || JSON.stringify(json);
    throw new Error(`${method} ${path} → ${res.status}\n${detail}`);
  }
  return json;
}
const get = (p) => api('GET', p);
// 쓰기 작업: dry-run 이면 로그만 남기고 건너뜀
async function write(method, path, body, label) {
  if (DRY) {
    console.log(`    · (dry-run) ${label}`);
    return null;
  }
  const r = await api(method, path, body);
  console.log(`    ✓ ${label}`);
  return r;
}

// ── 로컬 문구 읽기 ─────────────────────────────────────────────────────────────
function readFileTrim(path) {
  if (!existsSync(path)) return null;
  const v = readFileSync(path, 'utf8').trim();
  return v.length ? v : null;
}

// App Store 텍스트 필드(특히 설명)는 이모지/그림문자를 거부한다.
// (Play 문구엔 섹션 헤더용 데코 이모지가 있음 → App Store 반영 시에만 제거)
// 이모지 + 변형선택자(U+FE0F) + ZWJ(U+200D) 묶음 + 뒤따르는 공백 1칸을 제거
function stripEmoji(s) {
  if (!s) return s;
  const re = /\p{Extended_Pictographic}[️‍]*[ \t]?/gu;
  return s.replace(re, '').replace(/[ \t]+\n/g, '\n').trim();
}
// App Store(iOS) 전용 오버라이드 파일명: 'full-description.txt' → 'full-description.ios.txt'.
// iOS 앱은 가계부 외 기능(사진첩/재테크/커뮤니티)을 숨기므로, 스토어 문구도 가계부만
// 서술한 .ios 변형이 있으면 그걸 쓴다. 없으면 Play 와 공유하는 기본 파일로 fallback.
// (Play 리스팅은 play-listing.mjs 가 기본 파일을 그대로 읽으므로 영향 없음.)
function iosVariant(file) {
  return file.replace(/\.txt$/, '.ios.txt');
}

function readContent(flags) {
  const dir = join(LISTINGS_DIR, CONFIG.langDir);
  const c = {};
  let usedIos = false;
  for (const f of [...VERSION_FIELDS, ...APPINFO_FIELDS]) {
    const iosPath = join(dir, iosVariant(f.file));
    const useIos = existsSync(iosPath);
    const chosenFile = useIos ? iosVariant(f.file) : f.file;
    const v = readFileTrim(join(dir, chosenFile));
    if (useIos) usedIos = true;
    if (v == null) {
      if (f.required) throw new Error(`필수 문구 파일이 없습니다: ${join('apps/mobile/store/listings', CONFIG.langDir, f.file)}`);
      continue;
    }
    if (f.max && [...v].length > f.max) {
      throw new Error(`${f.label}(${chosenFile})가 ${f.max}자를 초과했습니다: ${[...v].length}자`);
    }
    c[f.key] = v;
  }
  if (usedIos) console.log('※ App Store 전용 iOS 문구(.ios.txt)를 사용합니다 (가계부 기능만 서술).');
  // 릴리스 노트(what's new) — 첫 출시엔 불필요하므로 --whats-new 일 때만
  if (flags.whatsNew) {
    const wn = readFileTrim(join(RELEASE_NOTES_DIR, `${CONFIG.langDir}.txt`));
    if (wn) c.whatsNew = wn;
  }
  // App Store 비허용 이모지 제거 (Play 데코 이모지 → App Store 반영 시에만)
  let stripped = false;
  for (const k of Object.keys(c)) {
    const cleaned = stripEmoji(c[k]);
    if (cleaned !== c[k]) {
      c[k] = cleaned;
      stripped = true;
    }
  }
  if (stripped) console.log('※ App Store 비허용 이모지를 텍스트에서 제거했습니다 (Play 데코 이모지).');
  return c;
}
function appJsonVersion() {
  return JSON.parse(readFileSync(join(MOBILE_DIR, 'app.json'), 'utf8'))?.expo?.version || '1.0.0';
}

// ── 버전 (없으면 생성) ─────────────────────────────────────────────────────────
const EDITABLE = new Set([
  'PREPARE_FOR_SUBMISSION',
  'DEVELOPER_REJECTED',
  'REJECTED',
  'METADATA_REJECTED',
  'INVALID_BINARY',
]);
const stateOf = (attrs) => attrs.appStoreState || attrs.appVersionState || attrs.state || '';

async function getEditableVersion() {
  const { data } = await get(
    `/v1/apps/${CONFIG.appAppleId}/appStoreVersions?filter[platform]=IOS&limit=50`
  );
  const editable = data.filter((v) => EDITABLE.has(stateOf(v.attributes)));
  if (editable.length) {
    const v = editable[0];
    console.log(`  버전: ${v.attributes.versionString} (${stateOf(v.attributes)})`);
    return v;
  }
  if (data.length) {
    console.log(
      `  ⚠ 편집 가능한 iOS 버전이 없습니다. 현재 상태: ${data
        .map((v) => `${v.attributes.versionString}=${stateOf(v.attributes)}`)
        .join(', ')}`
    );
  }
  // 편집 가능한 버전이 없으면 새로 생성 (app.json 버전 사용)
  const versionString = appJsonVersion();
  const r = await write(
    'POST',
    '/v1/appStoreVersions',
    {
      data: {
        type: 'appStoreVersions',
        attributes: { platform: 'IOS', versionString },
        relationships: { app: { data: { type: 'apps', id: CONFIG.appAppleId } } },
      },
    },
    `버전 ${versionString} 생성`
  );
  return r?.data || null;
}

// ── 버전 현지화 ────────────────────────────────────────────────────────────────
async function upsertVersionLocalization(versionId, content) {
  const attrs = {
    description: content.description,
    keywords: content.keywords,
    supportUrl: CONFIG.supportUrl,
  };
  if (content.promotionalText) attrs.promotionalText = content.promotionalText;
  if (CONFIG.marketingUrl) attrs.marketingUrl = CONFIG.marketingUrl;
  if (content.whatsNew) attrs.whatsNew = content.whatsNew;

  const { data } = await get(`/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=50`);
  const loc = data.find((l) => l.attributes.locale === CONFIG.locale);
  if (loc) {
    await write(
      'PATCH',
      `/v1/appStoreVersionLocalizations/${loc.id}`,
      { data: { type: 'appStoreVersionLocalizations', id: loc.id, attributes: attrs } },
      `버전 현지화(${CONFIG.locale}) 업데이트`
    );
  } else {
    await write(
      'POST',
      '/v1/appStoreVersionLocalizations',
      {
        data: {
          type: 'appStoreVersionLocalizations',
          attributes: { ...attrs, locale: CONFIG.locale },
          relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } } },
        },
      },
      `버전 현지화(${CONFIG.locale}) 생성`
    );
  }
}

// ── 앱 정보 (카테고리 + 현지화) ────────────────────────────────────────────────
async function getEditableAppInfo() {
  const { data } = await get(`/v1/apps/${CONFIG.appAppleId}/appInfos?limit=10`);
  if (!data.length) throw new Error('appInfos 를 찾을 수 없습니다.');
  return data.find((a) => EDITABLE.has(stateOf(a.attributes))) || data[0];
}

async function setCategories(appInfoId) {
  const relationships = {
    primaryCategory: { data: { type: 'appCategories', id: CONFIG.primaryCategory } },
    secondaryCategory: CONFIG.secondaryCategory
      ? { data: { type: 'appCategories', id: CONFIG.secondaryCategory } }
      : { data: null },
  };
  await write(
    'PATCH',
    `/v1/appInfos/${appInfoId}`,
    { data: { type: 'appInfos', id: appInfoId, relationships } },
    `카테고리 설정 (기본=${CONFIG.primaryCategory}${CONFIG.secondaryCategory ? `, 보조=${CONFIG.secondaryCategory}` : ''})`
  );
}

async function upsertAppInfoLocalization(appInfoId, content) {
  const attrs = { privacyPolicyUrl: CONFIG.privacyPolicyUrl };
  if (content.name) attrs.name = content.name;
  if (content.subtitle) attrs.subtitle = content.subtitle;

  const { data } = await get(`/v1/appInfos/${appInfoId}/appInfoLocalizations?limit=50`);
  const loc = data.find((l) => l.attributes.locale === CONFIG.locale);
  if (loc) {
    await write(
      'PATCH',
      `/v1/appInfoLocalizations/${loc.id}`,
      { data: { type: 'appInfoLocalizations', id: loc.id, attributes: attrs } },
      `앱 정보 현지화(${CONFIG.locale}) 업데이트 (부제/개인정보처리방침 URL)`
    );
  } else {
    await write(
      'POST',
      '/v1/appInfoLocalizations',
      {
        data: {
          type: 'appInfoLocalizations',
          attributes: { ...attrs, locale: CONFIG.locale },
          relationships: { appInfo: { data: { type: 'appInfos', id: appInfoId } } },
        },
      },
      `앱 정보 현지화(${CONFIG.locale}) 생성`
    );
  }
}

// ── 심사 정보 (데모 계정) ──────────────────────────────────────────────────────
function reviewInput() {
  const r = {
    contactFirstName: process.env.ASC_CONTACT_FIRST || '',
    contactLastName: process.env.ASC_CONTACT_LAST || '',
    contactPhone: process.env.ASC_CONTACT_PHONE || '',
    contactEmail: process.env.ASC_CONTACT_EMAIL || 'swon3210@gmail.com',
    demoAccountName: process.env.ASC_DEMO_USER || '',
    demoAccountPassword: process.env.ASC_DEMO_PASSWORD || '',
    demoAccountRequired: true,
    notes: process.env.ASC_REVIEW_NOTES || DEFAULT_NOTES,
  };
  const missing = [];
  if (!r.contactFirstName) missing.push('ASC_CONTACT_FIRST');
  if (!r.contactLastName) missing.push('ASC_CONTACT_LAST');
  if (!r.contactPhone) missing.push('ASC_CONTACT_PHONE');
  if (!r.demoAccountName) missing.push('ASC_DEMO_USER');
  if (!r.demoAccountPassword) missing.push('ASC_DEMO_PASSWORD');
  return { r, missing };
}

async function upsertReviewDetail(versionId, r) {
  const rel = await get(`/v1/appStoreVersions/${versionId}/appStoreReviewDetail`).catch(() => ({ data: null }));
  const existing = rel?.data;
  if (existing?.id) {
    await write(
      'PATCH',
      `/v1/appStoreReviewDetails/${existing.id}`,
      { data: { type: 'appStoreReviewDetails', id: existing.id, attributes: r } },
      '심사 정보(데모 계정/연락처/노트) 업데이트'
    );
  } else {
    await write(
      'POST',
      '/v1/appStoreReviewDetails',
      {
        data: {
          type: 'appStoreReviewDetails',
          attributes: r,
          relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } } },
        },
      },
      '심사 정보(데모 계정/연락처/노트) 생성'
    );
  }
}

// ── 엔트리 ─────────────────────────────────────────────────────────────────────
async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command !== 'push') {
    console.error('사용법: node scripts/appstore-listing.mjs push [--dry-run] [--skip-review] [--whats-new] [--key <경로>]');
    process.exit(1);
  }
  DRY = flags.dryRun;

  const content = readContent(flags);
  const auth = loadAuth(flags);
  TOKEN = makeToken(auth);

  // 앱 확인
  const { data: app } = await get(
    `/v1/apps/${CONFIG.appAppleId}?fields[apps]=name,bundleId,primaryLocale`
  );
  console.log(`앱: ${app.attributes.name} (${app.attributes.bundleId}) · Apple ID ${CONFIG.appAppleId}`);
  if (DRY) console.log('※ --dry-run: 실제 반영 없이 미리보기만 합니다.\n');

  // 심사 정보 입력값 사전 검증 (쓰기 전에)
  let review = null;
  if (!flags.skipReview) {
    const { r, missing } = reviewInput();
    if (missing.length) {
      console.log(`\n⚠ 심사 정보(데모 계정 등)를 건너뜁니다 — 다음 env 미설정: ${missing.join(', ')}`);
      console.log('   (텍스트/카테고리는 그대로 진행. 나중에 env 채워 다시 실행하면 심사 정보만 채워짐)');
    } else {
      review = r;
    }
  }

  console.log('\n[1/4] 버전 현지화');
  const version = await getEditableVersion();
  if (version) {
    // 업로드된 빌드(app.json 버전)와 스토어 버전 문자열을 일치시킴 (안 맞으면 빌드가 안 붙음)
    const want = appJsonVersion();
    if (version.attributes.versionString !== want) {
      await write(
        'PATCH',
        `/v1/appStoreVersions/${version.id}`,
        { data: { type: 'appStoreVersions', id: version.id, attributes: { versionString: want } } },
        `버전 문자열 ${version.attributes.versionString} → ${want} (업로드된 빌드와 일치)`
      );
    }
    await upsertVersionLocalization(version.id, content);
  } else {
    console.log('    · (dry-run) 버전이 없어 현지화는 건너뜀 — 실제 실행 시 버전 생성 후 채워짐');
  }

  console.log('\n[2/4] 카테고리');
  const appInfo = await getEditableAppInfo();
  await setCategories(appInfo.id);

  console.log('\n[3/4] 앱 정보 현지화 (부제 / 개인정보처리방침 URL / 이름)');
  await upsertAppInfoLocalization(appInfo.id, content);

  console.log('\n[4/4] 심사 정보 (데모 계정)');
  if (review && version) {
    await upsertReviewDetail(version.id, review);
  } else if (flags.skipReview) {
    console.log('    · --skip-review 로 건너뜀');
  } else if (!review) {
    console.log('    · 데모 계정 env 미설정으로 건너뜀 (위 경고 참고)');
  } else {
    console.log('    · (dry-run) 버전 없음으로 건너뜀');
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(DRY ? '미리보기 완료 (반영 안 됨).' : '반영 완료.');
  console.log('아직 UI에서 직접 해야 하는 것:');
  console.log('  · 스크린샷 (iPhone 6.9"/6.7" 규격)');
  console.log('  · 연령 등급(Age Rating) 설문');
  console.log('  · App Privacy(데이터 수집) 설문 — apps/mobile/store/data-safety.md 답 재사용');
  console.log('  · 빌드 연결 확인 후 Submit for Review');
}

main().catch((err) => {
  console.error(`\n✗ 실패: ${err.message}`);
  process.exit(1);
});
