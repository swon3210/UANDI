#!/usr/bin/env node
/**
 * 소스 코드의 한글 하드코딩 가드 (ratchet).
 *
 * 주석을 제외한 코드(문자열 리터럴·JSX 텍스트)에 한글이 들어 있는 줄 수를 파일별로 세고,
 * `scripts/i18n/hardcoded-korean.baseline.json` 과 비교한다.
 *   - 기준선에 없는 파일에 한글이 생기거나, 기준선보다 줄 수가 늘면 실패(exit 1)
 *   - 줄 수가 줄었으면 통과하되 `--update` 로 기준선을 내리라고 안내한다
 *
 * 사용:
 *   node scripts/check-hardcoded-korean.mjs            # 검사
 *   node scripts/check-hardcoded-korean.mjs --update   # 기준선 갱신(추출 PR 마지막에 실행)
 *   node scripts/check-hardcoded-korean.mjs --list     # 파일별 현재 줄 수 출력
 *
 * 한글 문자열은 메시지 파일(apps/web/messages/{ko,en}/*.json)로 옮기고 t() 로 읽는다 — docs/10-i18n.md.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = join(ROOT, 'scripts/i18n/hardcoded-korean.baseline.json');

/** 검사 대상 디렉토리(루트 기준) */
const SCAN_DIRS = [
  'apps/web/src',
  'packages/ui/src',
  'packages/cashbook-core/src',
  'packages/investment-core/src',
  'functions/src',
];

const SOURCE_EXT = /\.(ts|tsx)$/;
/** 제외: 스토리·테스트·E2E·타입 선언 */
const EXCLUDE_FILE = /(\.stories\.tsx?|\.test\.tsx?|\.spec\.tsx?|\.d\.ts)$/;
const EXCLUDE_DIR = new Set(['node_modules', '__tests__', 'e2e', '.next', 'lib']);

const HANGUL = /[ㄱ-ㆎ가-힣]/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!EXCLUDE_DIR.has(name)) walk(full, out);
    } else if (SOURCE_EXT.test(name) && !EXCLUDE_FILE.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * 주석(//, /* *\/, JSX {/* *\/})을 공백으로 지운 코드를 돌려준다. 문자열·템플릿 리터럴 안의 `//` 는 보존.
 * 정규식 리터럴 안의 따옴표 같은 드문 경우는 다루지 않는다(기준선 ratchet 용도로 충분).
 */
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let quote = null; // "'" | '"' | '`' | null
  while (i < n) {
    const ch = src[i];
    const next = src[i + 1];
    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '/') {
      while (i < n && src[i] !== '\n') i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') out += '\n'; // 줄 번호 유지
        i += 1;
      }
      i += 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function countKoreanLines(file) {
  const code = stripComments(readFileSync(file, 'utf8'));
  return code.split('\n').filter((line) => HANGUL.test(line)).length;
}

function scan() {
  const counts = {};
  for (const dir of SCAN_DIRS) {
    const abs = join(ROOT, dir);
    if (!existsSync(abs)) continue;
    for (const file of walk(abs)) {
      const c = countKoreanLines(file);
      if (c > 0) counts[relative(ROOT, file)] = c;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) return {};
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
}

const args = new Set(process.argv.slice(2));
const current = scan();
const total = Object.values(current).reduce((a, b) => a + b, 0);

if (args.has('--list')) {
  for (const [file, c] of Object.entries(current)) console.log(`${String(c).padStart(5)}  ${file}`);
  console.log(`\n총 ${Object.keys(current).length}개 파일, ${total}줄`);
  process.exit(0);
}

if (args.has('--update')) {
  writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2) + '\n');
  console.log(
    `기준선 갱신: ${Object.keys(current).length}개 파일, ${total}줄 → ${relative(ROOT, BASELINE_PATH)}`
  );
  process.exit(0);
}

const baseline = loadBaseline();
const regressions = [];
const improvements = [];
for (const [file, c] of Object.entries(current)) {
  const base = baseline[file] ?? 0;
  if (c > base) regressions.push({ file, base, c });
  else if (c < base) improvements.push({ file, base, c });
}
for (const file of Object.keys(baseline)) {
  if (!(file in current)) improvements.push({ file, base: baseline[file], c: 0 });
}

if (regressions.length > 0) {
  console.error(
    '✗ 한글 하드코딩이 늘었습니다. 메시지 파일(apps/web/messages)로 옮기고 t() 를 쓰세요:'
  );
  for (const { file, base, c } of regressions) console.error(`  ${file}: ${base} → ${c}줄`);
  console.error(
    '\n(의도한 예외라면 `node scripts/check-hardcoded-korean.mjs --update` 로 기준선을 올리되 PR 에 이유를 적습니다)'
  );
  process.exit(1);
}

if (improvements.length > 0) {
  const saved = improvements.reduce((a, { base, c }) => a + (base - c), 0);
  console.log(
    `✓ 한글 하드코딩 ${saved}줄 감소 (${improvements.length}개 파일). 기준선을 내리려면 --update 를 실행하세요.`
  );
} else {
  console.log(`✓ 한글 하드코딩 기준선 유지 (${Object.keys(current).length}개 파일, ${total}줄)`);
}
