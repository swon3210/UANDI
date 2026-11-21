/**
 * 문의 답장 이메일 도우미 — 말랑 정체성(이모티콘·로고 서명)을 담은 HTML 답장을
 * 미리보기하고, ego-browser(ego lite)로 Gmail 임시보관함에 초안을 만든다. **보내지는 않는다.**
 *
 * 사용 (repo 루트에서):
 *   node scripts/feedback-reply-email.mjs preview <reply.html> [--out <png>]
 *     → 브랜드 이미지를 data URI로 인라인한 미리보기를 ego-browser로 열어 캡처한다(배포 전 이미지도 보인다).
 *   node scripts/feedback-reply-email.mjs draft <reply.html> --to <email> --subject <제목> [--space <이름>] [--dry-run]
 *     → 본문 이미지 URL이 모두 200인지 확인한 뒤, Gmail 편지쓰기에 받는사람·제목·HTML 본문을 넣고
 *       임시보관함에 저장된 화면을 캡처한다. --dry-run 은 ego-browser 스크립트만 출력한다.
 *
 * 전제: ego lite에 운영 Gmail(swon3210@gmail.com)이 로그인돼 있어야 한다. 절차는 .claude/skills/reply-feedback/SKILL.md.
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, isAbsolute } from 'path';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const BRAND_DIR = join(REPO_ROOT, 'apps', 'web', 'public', 'brand');
const BRAND_URL = 'https://uandi-web.vercel.app/brand/';
const DEFAULT_SPACE = '말랑 문의 답장 메일';

// ── 인자 ──────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const [cmd, file, ...rest] = argv;
  const opts = {
    cmd,
    file,
    to: null,
    subject: null,
    space: DEFAULT_SPACE,
    out: null,
    dryRun: false,
  };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    const next = () => rest[++i];
    if (a === '--to') opts.to = next();
    else if (a === '--subject') opts.subject = next();
    else if (a === '--space') opts.space = next();
    else if (a === '--out') opts.out = next();
    else if (a === '--dry-run') opts.dryRun = true;
    else throw new Error(`알 수 없는 인자: ${a}`);
  }
  if (!['preview', 'draft'].includes(cmd) || !file) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    process.exit(cmd ? 1 : 0);
  }
  if (cmd === 'draft') {
    if (!opts.to || !/^[^@\s]+@[^@\s]+$/.test(opts.to))
      throw new Error('--to <email> 이 필요합니다.');
    if (!opts.subject) throw new Error('--subject <제목> 이 필요합니다.');
  }
  return opts;
}

const abs = (p) => (isAbsolute(p) ? p : resolve(process.cwd(), p));

function loadHtml(file) {
  const html = readFileSync(abs(file), 'utf8');
  const leftover = html.match(/\[\[[^\]]*\]\]/g);
  if (leftover)
    throw new Error(`템플릿 자리표시자가 남아 있습니다: ${leftover.slice(0, 3).join(', ')}`);
  const comments = html.match(/<!--[\s\S]*?-->/g) ?? [];
  return comments.length ? html.replace(/<!--[\s\S]*?-->/g, '') : html;
}

/** HTML → 평문 폴백(리치 붙여넣기의 text 부분) */
function toPlainText(html) {
  return html
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/(p|li|tr|div|h\d)>/g, '\n')
    .replace(/<li[^>]*>/g, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function brandUrls(html) {
  return [
    ...new Set(
      [...html.matchAll(/https:\/\/uandi-web\.vercel\.app\/brand\/([^"'\s)]+)/g)].map((m) => m[1])
    ),
  ];
}

function runEgo(script, dryRun) {
  if (dryRun) {
    console.log(script);
    return;
  }
  const r = spawnSync('ego-browser', ['nodejs'], {
    input: script,
    encoding: 'utf8',
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (r.error?.code === 'ENOENT')
    throw new Error('ego-browser 를 찾을 수 없습니다. ego lite 설치 후 다시 실행하세요.');
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// ── preview ───────────────────────────────────────────────────────────────────
function preview(opts) {
  const html = loadHtml(opts.file);
  const inlined = html.replace(/https:\/\/uandi-web\.vercel\.app\/brand\/([^"'\s)]+)/g, (_, p) => {
    const buf = readFileSync(join(BRAND_DIR, p)); // 없으면 여기서 throw → 배포 전 파일명 오타를 잡는다
    return `data:image/png;base64,${buf.toString('base64')}`;
  });
  const dir = mkdtempSync(join(tmpdir(), 'malang-reply-'));
  const previewPath = join(dir, 'preview.html');
  writeFileSync(
    previewPath,
    `<!doctype html><meta charset="utf-8"><body style="margin:24px;background:#fff">${inlined}`
  );
  const out = opts.out ? abs(opts.out) : join(dir, 'preview.png');
  runEgo(
    `
const task = await taskSpace(${JSON.stringify(opts.space)});
const p = await task.newPage();
await p.goto(${JSON.stringify('file://' + previewPath)});
await p.waitForLoadState();
const shot = await p.screenshot({ path: ${JSON.stringify(out)} });
await p.close();
console.log(JSON.stringify({ preview: ${JSON.stringify(previewPath)}, screenshot: shot }));
`,
    opts.dryRun
  );
}

// ── draft ─────────────────────────────────────────────────────────────────────
async function draft(opts) {
  const html = loadHtml(opts.file);
  const text = toPlainText(html);

  // 본문 이미지가 프로덕션에 떠 있는지 먼저 확인 — 404면 Gmail 이 깨진 이미지를 캐시한다.
  if (!opts.dryRun) {
    const missing = [];
    for (const p of brandUrls(html)) {
      const res = await fetch(BRAND_URL + p, { method: 'HEAD' }).catch(() => null);
      if (!res || res.status !== 200) missing.push(`${p} (${res?.status ?? 'ERR'})`);
    }
    if (missing.length)
      throw new Error(
        `프로덕션에 없는 이미지가 있습니다. 배포 후 다시 실행하세요: ${missing.join(', ')}`
      );
  }

  const dir = mkdtempSync(join(tmpdir(), 'malang-reply-'));
  const shotPath = join(dir, 'gmail-draft.png');
  runEgo(
    `
const task = await taskSpace(${JSON.stringify(opts.space)});
const page = task.page("p1");
await page.goto("https://mail.google.com/mail/u/0/#inbox", { timeout: 45000 });
await page.waitForLoadState();
const title = await page.title();
if (!/Gmail/.test(title) || /로그인|Sign in/.test(title)) {
  console.log(JSON.stringify({ error: "Gmail 로그인 필요", title }));
  await task.handOff();
  process.exit(2);
}
await page.click("text=편지쓰기", { label: "open compose" });
await page.waitForSelector("input[name='subjectbox']", { state: "visible", timeout: 15000 });
await page.click("input[aria-label='수신자']", { label: "focus recipient field" });
await page.keyboard.type(${JSON.stringify(opts.to)});
await page.keyboard.press("Enter");
await page.fill("input[name='subjectbox']", ${JSON.stringify(opts.subject)});
await page.click("div[aria-label='메일 본문']", { label: "focus mail body" });
await page.keyboard.paste({ text: ${JSON.stringify(text)}, html: ${JSON.stringify(html)} });
await page.waitForFunction(() => {
  const imgs = [...document.querySelectorAll("div[aria-label='메일 본문'] img")];
  return imgs.length > 0 && imgs.every((i) => i.complete);
}, undefined, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1500); // 임시보관함 자동 저장
const state = await page.evaluate(() => {
  const dlg = document.querySelector("input[name='subjectbox']")?.closest("div[role='dialog'], table")?.parentElement ?? document;
  const imgs = [...document.querySelectorAll("div[aria-label='메일 본문'] img")];
  return {
    subject: document.querySelector("input[name='subjectbox']")?.value,
    bodyChars: document.querySelector("div[aria-label='메일 본문']")?.innerText.length,
    imgs: imgs.map((i) => ({ src: i.getAttribute("src")?.split("/").pop(), loaded: i.complete && i.naturalWidth > 0 })),
  };
});
await page.evaluate(() => document.querySelector("div[aria-label='메일 본문']")?.scrollIntoView({ block: "start" }));
const shot = await page.screenshot({ path: ${JSON.stringify(shotPath)} });
console.log(JSON.stringify({ to: ${JSON.stringify(opts.to)}, ...state, screenshot: shot, sent: false }));
`,
    opts.dryRun
  );
}

const opts = parseArgs(process.argv.slice(2));
if (opts.cmd === 'preview') preview(opts);
else await draft(opts);
