/**
 * Play Console 스토어 등록정보(텍스트 + 그래픽) 동기화 스크립트
 *
 * 빌드 제출(`eas submit`)에 쓰는 것과 동일한 Google Play 서비스 계정 키로
 * Android Publisher API(`androidpublisher` v3)를 호출해 스토어 등록정보를
 * 내려받거나(pull) 올린다(push).
 *
 *   pull  — Play Console의 현재 등록정보 텍스트를 로컬 파일로 저장
 *   push  — 로컬 파일(텍스트 + 스크린샷)을 Play Console에 반영
 *
 * 로컬 디렉토리 규약 (apps/mobile/store/listings/<언어>/):
 *
 *   apps/mobile/store/listings/
 *     ko-KR/
 *       title.txt              앱 이름        (최대 30자)
 *       short-description.txt  간단한 설명     (최대 80자)
 *       full-description.txt   자세한 설명     (최대 4000자)
 *       video.txt              프로모션 영상 URL (선택)
 *       images/
 *         phoneScreenshots/    폰 스크린샷 1.png, 2.png ... (2~8장)
 *         sevenInchScreenshots/
 *         tenInchScreenshots/
 *         featureGraphic/      1024x500 1장
 *         icon/                512x512 1장
 *
 * 인증:
 *   서비스 계정 키 경로는 아래 순서로 결정한다.
 *     1) --key <path>
 *     2) 환경변수 PLAY_SERVICE_ACCOUNT
 *     3) apps/mobile/play-service-account.json (기본값)
 *   서비스 계정에 Play Console "스토어 등록정보 편집" 권한이 있어야 한다.
 *
 * 사용:
 *   node scripts/play-listing.mjs pull
 *   node scripts/play-listing.mjs push
 *   node scripts/play-listing.mjs push --dry-run
 *   node scripts/play-listing.mjs push --lang ko-KR
 *   node scripts/play-listing.mjs push --text-only      # 스크린샷 건너뜀
 *   node scripts/play-listing.mjs push --images-only     # 텍스트 건너뜀
 *
 * 사전 요구: pnpm add -Dw googleapis
 */
import { createRequire } from 'module';
import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  statSync,
  createReadStream,
} from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { google } = require('googleapis');

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const MOBILE_DIR = join(REPO_ROOT, 'apps', 'mobile');
const LISTINGS_DIR = join(MOBILE_DIR, 'store', 'listings');

// Play 등록정보 텍스트 필드 ↔ 로컬 파일 매핑
const TEXT_FIELDS = [
  { key: 'title', file: 'title.txt', max: 30, label: '앱 이름' },
  { key: 'shortDescription', file: 'short-description.txt', max: 80, label: '간단한 설명' },
  { key: 'fullDescription', file: 'full-description.txt', max: 4000, label: '자세한 설명' },
  { key: 'video', file: 'video.txt', max: 0, label: '프로모션 영상' },
];

// Play 가 인식하는 이미지 타입(= images/ 하위 폴더명)
const IMAGE_TYPES = [
  'phoneScreenshots',
  'sevenInchScreenshots',
  'tenInchScreenshots',
  'tvScreenshots',
  'wearScreenshots',
  'featureGraphic',
  'icon',
  'tvBanner',
];
const SINGLE_IMAGE_TYPES = new Set(['featureGraphic', 'icon', 'tvBanner']);

// ── 인자 파싱 ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = { dryRun: false, textOnly: false, imagesOnly: false, lang: null, key: null };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--') continue; // pnpm 이 전달하는 구분자 무시
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--text-only') flags.textOnly = true;
    else if (a === '--images-only') flags.imagesOnly = true;
    else if (a === '--lang') flags.lang = rest[++i];
    else if (a === '--key') flags.key = rest[++i];
    else throw new Error(`알 수 없는 인자: ${a}`);
  }
  return { command, flags };
}

// ── 설정 읽기 ──────────────────────────────────────────────────────────────
function getPackageName() {
  const appJson = JSON.parse(readFileSync(join(MOBILE_DIR, 'app.json'), 'utf8'));
  const pkg = appJson?.expo?.android?.package;
  if (!pkg) throw new Error('app.json 에서 expo.android.package 를 찾을 수 없습니다.');
  return pkg;
}

function resolveKeyPath(flags) {
  const candidate =
    flags.key || process.env.PLAY_SERVICE_ACCOUNT || join(MOBILE_DIR, 'play-service-account.json');
  if (!existsSync(candidate)) {
    throw new Error(
      `서비스 계정 키를 찾을 수 없습니다: ${candidate}\n` +
        '빌드 제출에 쓰던 키를 거기에 두거나 --key / PLAY_SERVICE_ACCOUNT 로 경로를 지정하세요.'
    );
  }
  return candidate;
}

async function getClient(keyPath) {
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const authClient = await auth.getClient();
  return google.androidpublisher({ version: 'v3', auth: authClient });
}

// ── 로컬 파일 헬퍼 ─────────────────────────────────────────────────────────
function langDirs() {
  if (!existsSync(LISTINGS_DIR)) return [];
  return readdirSync(LISTINGS_DIR).filter((d) => statSync(join(LISTINGS_DIR, d)).isDirectory());
}

function readTextFile(langDir, file) {
  const p = join(langDir, file);
  if (!existsSync(p)) return null;
  const v = readFileSync(p, 'utf8').trim();
  return v.length ? v : null;
}

function mimeFor(file) {
  const ext = extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return null;
}

function listImages(langDir, imageType) {
  const dir = join(langDir, 'images', imageType);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => mimeFor(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => join(dir, f));
}

// ── PULL ───────────────────────────────────────────────────────────────────
async function pull(client, packageName, flags) {
  const { data: edit } = await client.edits.insert({ packageName });
  const editId = edit.id;
  try {
    const { data } = await client.edits.listings.list({ packageName, editId });
    const listings = (data.listings || []).filter((l) => !flags.lang || l.language === flags.lang);
    if (!listings.length) {
      console.log('내려받을 등록정보가 없습니다.', flags.lang ? `(언어: ${flags.lang})` : '');
      return;
    }
    for (const l of listings) {
      const dir = join(LISTINGS_DIR, l.language);
      mkdirSync(dir, { recursive: true });
      for (const { key, file } of TEXT_FIELDS) {
        const value = l[key] || '';
        writeFileSync(join(dir, file), value, 'utf8');
      }
      console.log(`✓ ${l.language} → ${join('apps/mobile/store/listings', l.language)}/`);
    }
    console.log(
      `\n총 ${listings.length}개 언어의 등록정보 텍스트를 내려받았습니다. ` +
        '스크린샷은 직접 images/ 하위에 배치하세요.'
    );
  } finally {
    // 읽기 전용이므로 편집 세션을 커밋하지 않고 폐기한다.
    await client.edits.delete({ packageName, editId }).catch(() => {});
  }
}

// ── PUSH ───────────────────────────────────────────────────────────────────
async function pushText(client, packageName, editId, language, langDir) {
  const current = await client.edits.listings
    .get({ packageName, editId, language })
    .then((r) => r.data)
    .catch(() => ({}));

  const body = { language };
  let changed = false;
  const summary = [];
  for (const { key, file, max, label } of TEXT_FIELDS) {
    const value = readTextFile(langDir, file);
    // 파일이 없거나 비어있으면 기존 값 유지 (빈 값으로 덮어쓰지 않음)
    body[key] = value != null ? value : current[key] || '';
    if (value != null) {
      if (max > 0 && value.length > max) {
        throw new Error(
          `${language} ${label}(${file})이 ${max}자를 초과했습니다: ${value.length}자`
        );
      }
      if (value !== (current[key] || '')) {
        changed = true;
        summary.push(`    ${label}: ${value.length}자`);
      }
    }
  }
  if (!changed) {
    console.log(`  텍스트: 변경 없음`);
    return;
  }
  console.log(`  텍스트 업데이트:`);
  summary.forEach((s) => console.log(s));
  if (!global.__DRY_RUN__) {
    await client.edits.listings.update({ packageName, editId, language, requestBody: body });
  }
}

async function pushImages(client, packageName, editId, language, langDir) {
  for (const imageType of IMAGE_TYPES) {
    const files = listImages(langDir, imageType);
    if (!files.length) continue;

    if (SINGLE_IMAGE_TYPES.has(imageType) && files.length > 1) {
      console.log(`  ⚠ ${imageType}: 1장만 허용되는데 ${files.length}장 있음 → 첫 번째만 사용`);
      files.length = 1;
    }
    if (imageType.endsWith('Screenshots') && (files.length < 2 || files.length > 8)) {
      console.log(`  ⚠ ${imageType}: Play는 2~8장 필요 (현재 ${files.length}장)`);
    }

    console.log(`  ${imageType}: ${files.length}장 교체`);
    if (global.__DRY_RUN__) continue;

    // 기존 이미지를 모두 지우고 다시 올린다(멱등).
    await client.edits.images.deleteall({ packageName, editId, language, imageType });
    for (const file of files) {
      await client.edits.images.upload({
        packageName,
        editId,
        language,
        imageType,
        media: { mimeType: mimeFor(file), body: createReadStream(file) },
      });
    }
  }
}

async function push(client, packageName, flags) {
  global.__DRY_RUN__ = flags.dryRun;
  let langs = langDirs();
  if (flags.lang) langs = langs.filter((l) => l === flags.lang);
  if (!langs.length) {
    throw new Error(
      `올릴 등록정보 폴더가 없습니다: ${LISTINGS_DIR}\n` +
        '먼저 `node scripts/play-listing.mjs pull` 로 현재 값을 받아오세요.'
    );
  }

  const { data: edit } = await client.edits.insert({ packageName });
  const editId = edit.id;
  try {
    for (const language of langs) {
      const langDir = join(LISTINGS_DIR, language);
      console.log(`\n[${language}]`);
      if (!flags.imagesOnly) await pushText(client, packageName, editId, language, langDir);
      if (!flags.textOnly) await pushImages(client, packageName, editId, language, langDir);
    }

    if (flags.dryRun) {
      console.log('\n--dry-run: 편집 세션을 폐기합니다 (반영 안 됨).');
      await client.edits.delete({ packageName, editId }).catch(() => {});
      return;
    }

    await client.edits.validate({ packageName, editId });
    await client.edits.commit({ packageName, editId });
    console.log('\n✓ 커밋 완료. Play Console에 반영되었습니다 (검토가 필요할 수 있음).');
  } catch (err) {
    await client.edits.delete({ packageName, editId }).catch(() => {});
    throw err;
  }
}

// ── 엔트리 ─────────────────────────────────────────────────────────────────
async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (!command || !['pull', 'push'].includes(command)) {
    console.error('사용법: node scripts/play-listing.mjs <pull|push> [옵션]');
    console.error('  옵션: --dry-run --text-only --images-only --lang <코드> --key <경로>');
    process.exit(1);
  }
  const packageName = getPackageName();
  const keyPath = resolveKeyPath(flags);
  const client = await getClient(keyPath);
  console.log(`패키지: ${packageName}`);

  if (command === 'pull') await pull(client, packageName, flags);
  else await push(client, packageName, flags);
}

main().catch((err) => {
  const detail = err?.response?.data?.error?.message || err.message;
  console.error(`\n✗ 실패: ${detail}`);
  process.exit(1);
});
