/**
 * Play Console 출시노트(릴리스의 "이 버전의 새로운 기능") 동기화 스크립트
 *
 * 빌드 제출(`eas submit`) · 등록정보 동기화(`play-listing.mjs`)에 쓰는 것과
 * 동일한 Google Play 서비스 계정 키로 Android Publisher API(`androidpublisher` v3)의
 * `edits.tracks` 를 호출해, 특정 트랙(기본 production) 릴리스의 releaseNotes 를
 * 내려받거나(pull) 올린다(push).
 *
 * 출시노트는 "스토어 등록정보"(앱 이름·설명·스크린샷, play-listing.mjs 담당)와
 * 별개 영역이다. 트랙·버전별로 따로 관리된다.
 *
 *   pull  — 대상 트랙 릴리스의 현재 출시노트를 로컬 파일로 저장
 *   push  — 로컬 파일의 출시노트를 대상 트랙 릴리스에 반영(커밋)
 *
 * 로컬 디렉토리 규약 (apps/mobile/store/release-notes/):
 *
 *   apps/mobile/store/release-notes/
 *     ko-KR.txt   한국어 출시노트 (최대 500자)
 *     en-US.txt   (선택) 다른 언어는 파일을 추가하면 함께 처리
 *
 * 파일이 없는 언어는 건드리지 않는다(기존 Play 값 유지). 파일이 있는 언어만
 * 해당 텍스트로 교체한다.
 *
 * 대상 릴리스 선택:
 *   - 기본 트랙은 production (`--track <이름>` 으로 internal/alpha/beta 지정 가능)
 *   - 트랙에 릴리스가 여럿이면 `--version-code <N>` 으로 특정 릴리스 지정
 *   - 미지정 시 versionCode 가 가장 높은 릴리스를 대상으로 한다
 *
 * 인증(서비스 계정 키 경로 결정 순서, play-listing.mjs 와 동일):
 *     1) --key <path>
 *     2) 환경변수 PLAY_SERVICE_ACCOUNT
 *     3) apps/mobile/play-service-account.json (기본값)
 *   서비스 계정에 Play Console "출시 관리"(트랙 편집) 권한이 있어야 한다.
 *   (eas submit 에 쓰던 키라면 이미 권한이 있다.)
 *
 * 사용:
 *   node scripts/play-release-notes.mjs pull
 *   node scripts/play-release-notes.mjs pull --track production --version-code 17
 *   node scripts/play-release-notes.mjs push --dry-run
 *   node scripts/play-release-notes.mjs push
 *   node scripts/play-release-notes.mjs push --track production --version-code 17 --lang ko-KR
 *
 * 사전 요구: pnpm add -Dw googleapis
 */
import { createRequire } from 'module';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { google } = require('googleapis');

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const MOBILE_DIR = join(REPO_ROOT, 'apps', 'mobile');
const NOTES_DIR = join(MOBILE_DIR, 'store', 'release-notes');

// Play 출시노트 1개 언어 최대 길이
const MAX_NOTES_LEN = 500;

// ── 인자 파싱 ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const [command, ...rest] = argv;
  const flags = { dryRun: false, track: 'production', versionCode: null, lang: null, key: null };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--') continue; // pnpm 이 전달하는 구분자 무시
    else if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--track') flags.track = rest[++i];
    else if (a === '--version-code') flags.versionCode = Number(rest[++i]);
    else if (a === '--lang') flags.lang = rest[++i];
    else if (a === '--key') flags.key = rest[++i];
    else throw new Error(`알 수 없는 인자: ${a}`);
  }
  return { command, flags };
}

// ── 설정 읽기 (play-listing.mjs 와 동일한 규약) ─────────────────────────────
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
// release-notes/<lang>.txt → { language, text }
function readLocalNotes(flags) {
  if (!existsSync(NOTES_DIR)) return [];
  return readdirSync(NOTES_DIR)
    .filter((f) => extname(f).toLowerCase() === '.txt')
    .map((f) => ({ language: basename(f, '.txt'), file: f }))
    .filter((n) => !flags.lang || n.language === flags.lang)
    .map((n) => {
      const text = readFileSync(join(NOTES_DIR, n.file), 'utf8').trim();
      return { language: n.language, text };
    })
    .filter((n) => n.text.length > 0);
}

// ── 대상 릴리스 선택 ───────────────────────────────────────────────────────
function maxVersionCode(release) {
  return Math.max(...(release.versionCodes || ['0']).map((c) => Number(c)));
}

function pickRelease(track, flags) {
  const releases = track.releases || [];
  if (!releases.length) {
    throw new Error(
      `'${flags.track}' 트랙에 릴리스가 없습니다. ` +
        '먼저 빌드를 해당 트랙에 제출/생성한 뒤 출시노트를 넣으세요.'
    );
  }
  if (flags.versionCode != null) {
    const match = releases.find((r) =>
      (r.versionCodes || []).map(Number).includes(flags.versionCode)
    );
    if (!match) {
      const available = releases
        .map((r) => (r.versionCodes || []).join('/'))
        .join(', ');
      throw new Error(
        `'${flags.track}' 트랙에서 versionCode ${flags.versionCode} 릴리스를 찾지 못했습니다. ` +
          `(가용 versionCodes: ${available})`
      );
    }
    return match;
  }
  if (releases.length > 1) {
    const sorted = [...releases].sort((a, b) => maxVersionCode(b) - maxVersionCode(a));
    console.log(
      `  ⚠ '${flags.track}' 트랙에 릴리스가 ${releases.length}개 있습니다. ` +
        `versionCode 가 가장 높은 릴리스를 대상으로 합니다. ` +
        `(특정 릴리스 지정: --version-code)`
    );
    return sorted[0];
  }
  return releases[0];
}

function describeRelease(release) {
  const vc = (release.versionCodes || []).join('/');
  return `${release.name || '(이름없음)'} · versionCode ${vc} · status=${release.status}`;
}

// ── PULL ───────────────────────────────────────────────────────────────────
async function pull(client, packageName, flags) {
  const { data: edit } = await client.edits.insert({ packageName });
  const editId = edit.id;
  try {
    const { data: track } = await client.edits.tracks.get({
      packageName,
      editId,
      track: flags.track,
    });
    const release = pickRelease(track, flags);
    console.log(`대상 릴리스: ${describeRelease(release)}`);

    const notes = (release.releaseNotes || []).filter(
      (n) => !flags.lang || n.language === flags.lang
    );
    if (!notes.length) {
      console.log('내려받을 출시노트가 없습니다.', flags.lang ? `(언어: ${flags.lang})` : '');
      return;
    }
    mkdirSync(NOTES_DIR, { recursive: true });
    for (const n of notes) {
      const out = join(NOTES_DIR, `${n.language}.txt`);
      writeFileSync(out, `${(n.text || '').trim()}\n`, 'utf8');
      console.log(`✓ ${n.language} → ${join('apps/mobile/store/release-notes', `${n.language}.txt`)}`);
    }
  } finally {
    // 읽기 전용이므로 편집 세션을 커밋하지 않고 폐기한다.
    await client.edits.delete({ packageName, editId }).catch(() => {});
  }
}

// ── PUSH ───────────────────────────────────────────────────────────────────
async function push(client, packageName, flags) {
  const localNotes = readLocalNotes(flags);
  if (!localNotes.length) {
    throw new Error(
      `올릴 출시노트 파일이 없습니다: ${NOTES_DIR}/<언어>.txt\n` +
        '먼저 `node scripts/play-release-notes.mjs pull` 로 현재 값을 받아오거나 직접 작성하세요.'
    );
  }
  for (const n of localNotes) {
    if (n.text.length > MAX_NOTES_LEN) {
      throw new Error(
        `${n.language} 출시노트가 ${MAX_NOTES_LEN}자를 초과했습니다: ${n.text.length}자`
      );
    }
  }

  const { data: edit } = await client.edits.insert({ packageName });
  const editId = edit.id;
  try {
    const { data: track } = await client.edits.tracks.get({
      packageName,
      editId,
      track: flags.track,
    });
    const release = pickRelease(track, flags);
    console.log(`대상 릴리스: ${describeRelease(release)}`);

    // 기존 노트를 언어별로 병합: 파일이 있는 언어는 교체, 나머지는 유지.
    const byLang = new Map((release.releaseNotes || []).map((n) => [n.language, n]));
    for (const n of localNotes) {
      byLang.set(n.language, { language: n.language, text: n.text });
      console.log(`  ${n.language}: ${n.text.length}자`);
    }
    release.releaseNotes = [...byLang.values()];

    if (flags.dryRun) {
      console.log('\n--dry-run: 편집 세션을 폐기합니다 (반영 안 됨).');
      console.log('  최종 출시노트 미리보기:');
      for (const n of release.releaseNotes) {
        console.log(`\n  [${n.language}]\n${n.text.split('\n').map((l) => '    ' + l).join('\n')}`);
      }
      await client.edits.delete({ packageName, editId }).catch(() => {});
      return;
    }

    await client.edits.tracks.update({
      packageName,
      editId,
      track: flags.track,
      requestBody: track,
    });
    await client.edits.validate({ packageName, editId });
    await client.edits.commit({ packageName, editId });
    console.log(`\n✓ 커밋 완료. '${flags.track}' 트랙 출시노트가 반영되었습니다.`);
  } catch (err) {
    await client.edits.delete({ packageName, editId }).catch(() => {});
    throw err;
  }
}

// ── 엔트리 ─────────────────────────────────────────────────────────────────
async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (!command || !['pull', 'push'].includes(command)) {
    console.error('사용법: node scripts/play-release-notes.mjs <pull|push> [옵션]');
    console.error(
      '  옵션: --dry-run --track <이름> --version-code <N> --lang <코드> --key <경로>'
    );
    process.exit(1);
  }
  const packageName = getPackageName();
  const keyPath = resolveKeyPath(flags);
  const client = await getClient(keyPath);
  console.log(`패키지: ${packageName} · 트랙: ${flags.track}`);

  if (command === 'pull') await pull(client, packageName, flags);
  else await push(client, packageName, flags);
}

main().catch((err) => {
  const detail = err?.response?.data?.error?.message || err.message;
  console.error(`\n✗ 실패: ${detail}`);
  process.exit(1);
});
