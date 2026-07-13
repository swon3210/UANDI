/**
 * App Store Connect 스크린샷 업로드 스크립트 (Play 자동화의 App Store판)
 *
 * Play(scripts/play-listing.mjs)가 edits.images.deleteall→upload 로 스크린샷을 올리듯,
 * 이 스크립트는 App Store Connect API 로 iPhone 스크린샷을 올린다. 단, ASC 는
 * "예약(POST appScreenshots) → 업로드(PUT uploadOperations) → 커밋(PATCH uploaded=true)"
 * 3단계 흐름이라 별도 스크립트로 둔다.
 *
 * 소스 이미지는 Play 와 동일하게 apps/mobile/store/listings/ko-KR/images/phoneScreenshots/
 * 를 재사용하되, App Store iPhone 규격(1290×2796)으로 비율 유지 리사이즈 + 상/하단
 * 가장자리 색 샘플링 패딩(이음매 없음) 후 업로드한다. (sharp 사용, 디스크에 안 남김)
 *
 * 인증: appstore-listing.mjs 와 동일 — eas.json 의 submit.production.ios(ascApiKeyId/
 * IssuerId/Path) + .p8.
 *
 * 사용:
 *   node scripts/appstore-screenshots.mjs push                 # 업로드
 *   node scripts/appstore-screenshots.mjs push --dry-run       # 변환만(미리보기 /tmp), 업로드 X
 *   node scripts/appstore-screenshots.mjs push --preview       # 변환 이미지를 /tmp 에 저장
 *   node scripts/appstore-screenshots.mjs push --key <경로>    # .p8 경로 지정
 *
 * 사전 요구: Node 18+ (전역 fetch), sharp, .p8 을 apps/mobile/asc-api-key.p8 에.
 */
import crypto from 'crypto';
import { createRequire } from 'module';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname, resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const MOBILE_DIR = join(REPO_ROOT, 'apps', 'mobile');
const SRC_DIR = join(MOBILE_DIR, 'store', 'listings', 'ko-KR', 'images', 'phoneScreenshots');
const API = 'https://api.appstoreconnect.apple.com';

const CONFIG = {
  appAppleId: process.env.ASC_APP_ID || '6790130439',
  locale: 'ko',
  // 목표 규격: 1290×2796 = 6.7"(APP_IPHONE_67). Apple 은 iPhone 최대 규격을 6.7" 하나로 두고
  // 6.9" 기기까지 이걸로 커버한다(별도 6.9" 디스플레이 타입 없음). 이 한 세트로 iPhone 요건 충족.
  // (원하면 ASC_DISPLAY_TYPES 로 APP_IPHONE_65 등 추가 규격도 지정 가능 — 대개 불필요.)
  width: 1290,
  height: 2796,
  displayTypes: (process.env.ASC_DISPLAY_TYPES || 'APP_IPHONE_67').split(','),
};

// ── 인자 ──────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = { dryRun: false, preview: false, key: null };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--') continue;
    else if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--preview') flags.preview = true;
    else if (a === '--key') flags.key = rest[++i];
    else throw new Error(`알 수 없는 인자: ${a}`);
  }
  return { command, flags };
}

// ── 인증 (eas.json + .p8) ─────────────────────────────────────────────────────
function loadAuth(flags) {
  const ios = JSON.parse(readFileSync(join(MOBILE_DIR, 'eas.json'), 'utf8'))?.submit?.production
    ?.ios;
  if (!ios?.ascApiKeyId || !ios?.ascApiKeyIssuerId) {
    throw new Error(
      'eas.json 의 submit.production.ios 에서 ascApiKeyId/ascApiKeyIssuerId 를 찾을 수 없습니다.'
    );
  }
  const keyPath =
    flags.key ||
    process.env.ASC_API_KEY_PATH ||
    resolve(MOBILE_DIR, ios.ascApiKeyPath || './asc-api-key.p8');
  if (!existsSync(keyPath)) throw new Error(`ASC API 키(.p8)를 찾을 수 없습니다: ${keyPath}`);
  return { keyId: ios.ascApiKeyId, issuerId: ios.ascApiKeyIssuerId, keyPath };
}

function makeToken({ keyId, issuerId, keyPath }) {
  const privateKey = crypto.createPrivateKey(readFileSync(keyPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const signingInput = `${b64({ alg: 'ES256', kid: keyId, typ: 'JWT' })}.${b64({
    iss: issuerId,
    iat: now,
    exp: now + 18 * 60,
    aud: 'appstoreconnect-v1',
  })}`;
  const sig = crypto
    .sign('sha256', Buffer.from(signingInput), { key: privateKey, dsaEncoding: 'ieee-p1363' })
    .toString('base64url');
  return `${signingInput}.${sig}`;
}

let TOKEN = '';
async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const detail =
      (json.errors || []).map((e) => `${e.title}: ${e.detail}`).join('\n') || JSON.stringify(json);
    throw new Error(`${method} ${path} → ${res.status}\n${detail}`);
  }
  return json;
}
const get = (p) => api('GET', p);

// ── 이미지 변환 (비율 유지 + 가장자리색 패딩) ──────────────────────────────────
async function edgeColor(buf, which) {
  const meta = await sharp(buf).metadata();
  const strip = await sharp(buf)
    .extract({ left: 0, top: which === 'top' ? 0 : meta.height - 4, width: meta.width, height: 4 })
    .resize(1, 1)
    .raw()
    .toBuffer();
  return { r: strip[0], g: strip[1], b: strip[2] };
}

async function toIosBuffer(srcPath, W, H) {
  const meta = await sharp(srcPath).metadata();
  const scale = Math.min(W / meta.width, H / meta.height);
  const rw = Math.round(meta.width * scale);
  const rh = Math.round(meta.height * scale);
  let buf = await sharp(srcPath).resize(rw, rh, { fit: 'fill' }).toBuffer();

  const padY = H - rh;
  const padX = W - rw;
  const top = Math.floor(padY / 2);
  const bottom = padY - top;
  const left = Math.floor(padX / 2);
  const right = padX - left;

  if (top || bottom) {
    const topC = await edgeColor(buf, 'top');
    const botC = await edgeColor(buf, 'bottom');
    if (top) buf = await sharp(buf).extend({ top, background: topC }).toBuffer();
    if (bottom) buf = await sharp(buf).extend({ bottom, background: botC }).toBuffer();
  }
  if (left || right) {
    const sideC = await edgeColor(buf, 'top');
    buf = await sharp(buf).extend({ left, right, background: sideC }).toBuffer();
  }
  // 정확히 W×H 보장 + PNG(무알파) 로 통일 (App Store 는 알파 채널 스크린샷 거부)
  return sharp(buf)
    .resize(W, H, { fit: 'fill' })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer();
}

function sourceFiles() {
  if (!existsSync(SRC_DIR)) throw new Error(`소스 스크린샷 폴더가 없습니다: ${SRC_DIR}`);
  return readdirSync(SRC_DIR)
    .filter((f) => extname(f).toLowerCase() === '.png')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => ({ name: f, path: join(SRC_DIR, f) }));
}

// ── ASC 스크린샷 세트/업로드 ───────────────────────────────────────────────────
async function getKoLocalizationId() {
  const { data: versions } = await get(
    `/v1/apps/${CONFIG.appAppleId}/appStoreVersions?filter[platform]=IOS&limit=10`
  );
  const editable = versions.find((v) =>
    [
      'PREPARE_FOR_SUBMISSION',
      'DEVELOPER_REJECTED',
      'REJECTED',
      'METADATA_REJECTED',
      'INVALID_BINARY',
    ].includes(v.attributes.appStoreState || v.attributes.appVersionState || v.attributes.state)
  );
  if (!editable)
    throw new Error('편집 가능한 iOS 버전이 없습니다. 먼저 appstore-listing.mjs 를 실행하세요.');
  console.log(`  버전: ${editable.attributes.versionString}`);
  const { data: locs } = await get(
    `/v1/appStoreVersions/${editable.id}/appStoreVersionLocalizations?limit=50`
  );
  const ko = locs.find((l) => l.attributes.locale === CONFIG.locale);
  if (!ko)
    throw new Error(
      `${CONFIG.locale} 버전 현지화가 없습니다. 먼저 appstore-listing.mjs 를 실행하세요.`
    );
  return ko.id;
}

async function ensureSet(localizationId, displayType) {
  const { data: sets } = await get(
    `/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets?limit=50`
  );
  const existing = sets.find((s) => s.attributes.screenshotDisplayType === displayType);
  if (existing) {
    // 기존 스크린샷 모두 삭제(멱등 교체)
    const { data: shots } = await get(
      `/v1/appScreenshotSets/${existing.id}/appScreenshots?limit=50`
    );
    for (const s of shots) await api('DELETE', `/v1/appScreenshots/${s.id}`);
    return existing.id;
  }
  const r = await api('POST', '/v1/appScreenshotSets', {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: displayType },
      relationships: {
        appStoreVersionLocalization: {
          data: { type: 'appStoreVersionLocalizations', id: localizationId },
        },
      },
    },
  });
  return r.data.id;
}

async function uploadOne(setId, fileName, buffer) {
  // 1) 예약
  const reserve = await api('POST', '/v1/appScreenshots', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName, fileSize: buffer.length },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } },
    },
  });
  const id = reserve.data.id;
  const ops = reserve.data.attributes.uploadOperations || [];
  // 2) 바이트 업로드 (Apple 이 준 URL/헤더로 PUT)
  for (const op of ops) {
    const headers = {};
    for (const h of op.requestHeaders || []) headers[h.name] = h.value;
    const chunk = buffer.subarray(op.offset, op.offset + op.length);
    const res = await fetch(op.url, { method: op.method, headers, body: chunk });
    if (!res.ok) throw new Error(`업로드 실패 ${fileName}: ${res.status} ${await res.text()}`);
  }
  // 3) 커밋 (체크섬)
  const md5 = crypto.createHash('md5').update(buffer).digest('hex');
  await api('PATCH', `/v1/appScreenshots/${id}`, {
    data: { type: 'appScreenshots', id, attributes: { uploaded: true, sourceFileChecksum: md5 } },
  });
  return id;
}

async function setOrder(setId, ids) {
  await api('PATCH', `/v1/appScreenshotSets/${setId}/relationships/appScreenshots`, {
    data: ids.map((id) => ({ type: 'appScreenshots', id })),
  });
}

// ── main ───────────────────────────────────────────────────────────────────────
async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command !== 'push') {
    console.error(
      '사용법: node scripts/appstore-screenshots.mjs push [--dry-run] [--preview] [--key <경로>]'
    );
    process.exit(1);
  }

  const files = sourceFiles();
  console.log(`소스 스크린샷 ${files.length}장 (${SRC_DIR.replace(REPO_ROOT + '/', '')})`);
  if (files.length < 2 || files.length > 10) {
    console.log(`  ⚠ App Store 는 iPhone 스크린샷 1~10장 허용 (현재 ${files.length}장)`);
  }

  // 변환 (모든 소스 → iOS 규격 버퍼)
  console.log(`\n[변환] → ${CONFIG.width}×${CONFIG.height} (비율 유지 + 가장자리색 패딩)`);
  const images = [];
  for (const f of files) {
    const buf = await toIosBuffer(f.path, CONFIG.width, CONFIG.height);
    images.push({ name: f.name, buf });
    console.log(`  ✓ ${f.name} → ${buf.length.toLocaleString()} bytes`);
    if (flags.preview || flags.dryRun) {
      const out = join('/tmp', `ios-${f.name}`);
      writeFileSync(out, buf);
      console.log(`      미리보기: ${out}`);
    }
  }

  if (flags.dryRun) {
    console.log('\n--dry-run: 변환만 완료. 업로드는 하지 않았습니다 (/tmp 미리보기 확인).');
    return;
  }

  TOKEN = makeToken(loadAuth(flags));
  const { data: app } = await get(`/v1/apps/${CONFIG.appAppleId}?fields[apps]=name,bundleId`);
  console.log(`\n앱: ${app.attributes.name} (${app.attributes.bundleId})`);
  const locId = await getKoLocalizationId();

  for (const displayType of CONFIG.displayTypes) {
    console.log(`\n[${displayType}]`);
    try {
      const setId = await ensureSet(locId, displayType);
      const ids = [];
      for (const img of images) {
        const id = await uploadOne(setId, img.name, img.buf);
        ids.push(id);
        console.log(`  ✓ 업로드: ${img.name}`);
      }
      await setOrder(setId, ids);
      console.log(`  ✓ 순서 정렬 (${ids.length}장)`);
    } catch (err) {
      console.log(`  ✗ ${displayType} 실패(건너뜀): ${err.message.split('\n')[0]}`);
    }
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(
    '스크린샷 업로드 완료. ASC UI 에서 확인 후 나머지(연령등급/App Privacy/Submit) 진행.'
  );
}

main().catch((err) => {
  console.error(`\n✗ 실패: ${err.message}`);
  process.exit(1);
});
