/**
 * 스토어 등록정보용 "앱 소개 이미지" 생성기
 *
 * 원본 앱 스크린샷 위에 기능 설명 헤드라인(상단)을 얹어, 밋밋한 화면 캡처가 아니라
 * "이 화면으로 뭘 할 수 있는지" 한 줄로 보여주는 마케팅 이미지를 만든다.
 * (브랜드 배경 + 상단 문구 + 라운드+그림자 스크린샷)
 *
 * 입력(원본 스크린샷): --raw <base> (기본 apps/mobile/store/raw-screenshots)
 *   base/phone/*.png  base/seven/*.png  base/ten/*.png
 *   → 캡처(pnpm screenshots)가 store/listings/.../{phone,seven,ten}Screenshots 로 떨구므로
 *     그걸 base 하위로 복사해 두고 이 스크립트를 돌린다.
 *
 * 출력(타깃별):
 *   - play  (폰 1236×2400)          → store/listings/ko-KR/images/phoneScreenshots
 *   - seven (7" 태블릿 3072×1728)   → store/listings/ko-KR/images/sevenInchScreenshots
 *   - ten   (10" 태블릿 3456×1944)  → store/listings/ko-KR/images/tenInchScreenshots
 *   - ios   (아이폰 6.7" 1290×2796) → store/appstore/iphone67   ※ 가계부 화면만
 *
 * 사용:
 *   node scripts/store-marketing-images.mjs                     # 모든 타깃, 실제 출력 경로
 *   node scripts/store-marketing-images.mjs --targets play,ios  # 일부 타깃만
 *   node scripts/store-marketing-images.mjs --raw .context/raw  # 원본 base 지정
 *   node scripts/store-marketing-images.mjs --dry               # .context/out/<target> 에만 출력(미리보기)
 */
import { createRequire } from 'module';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, resolve, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const MOBILE = join(REPO, 'apps', 'mobile');
const IMAGES = join(MOBILE, 'store/listings/ko-KR/images');

// ── 화면별 헤드라인 ─────────────────────────────────────────────────────────
const CAPTIONS = {
  '1-dashboard': { line1: '누가 적어도 바로 보이는', line2: '둘이 함께 쓰는 가계부' },
  '2-quick-add': { line1: '말하듯 적으면 끝나는', line2: 'AI 가계부 입력' },
  '3-import': { line1: '통장·카드 내역을 올리면', line2: '지난 내역이 한 번에' },
  '4-cashflow': { line1: '다가올 지출까지 미리 보는', line2: '현금 흐름 캘린더' },
  '5-plan': { line1: '몇 가지만 적으면 끝나는', line2: '올해 예산 세우기' },
};

// 2026-11: Play·App Store 모두 가계부 5화면만 노출(재테크·커뮤니티 제외).
const IOS_SCREENS = Object.keys(CAPTIONS);

// ── 타깃 규격 ─────────────────────────────────────────────────────────────────
const TARGETS = {
  play: { W: 1236, H: 2400, raw: 'phone', out: join(IMAGES, 'phoneScreenshots'), landscape: false },
  ios: { W: 1290, H: 2796, raw: 'phone', out: join(IMAGES, 'phoneScreenshots.ios'), landscape: false, screens: IOS_SCREENS },
  seven: { W: 3072, H: 1728, raw: 'seven', out: join(IMAGES, 'sevenInchScreenshots'), landscape: true },
  ten: { W: 3456, H: 1944, raw: 'ten', out: join(IMAGES, 'tenInchScreenshots'), landscape: true },
};

const COLORS = {
  bgTop: '#FCEAE6',
  bgBottom: '#FBF6EE',
  headline: '#2E2A28',
  accent: '#E8837A',
};

function parseArgs(argv) {
  const a = { targets: Object.keys(TARGETS), raw: null, dry: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--targets') a.targets = argv[++i].split(',').map((s) => s.trim());
    else if (t === '--raw') a.raw = argv[++i];
    else if (t === '--dry') a.dry = true;
    else throw new Error(`알 수 없는 인자: ${t}`);
  }
  return a;
}

const xmlEscape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function backgroundSvg(W, H) {
  return Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${COLORS.bgTop}"/>
        <stop offset="1" stop-color="${COLORS.bgBottom}"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#bg)"/>
    </svg>`
  );
}

// 상단 헤드라인. 반환: {svg, headlineBottomY}
function headlineSvg(W, H, cap, landscape) {
  // 세로형은 폭 기준, 가로형(태블릿)은 높이 기준으로 폰트 크기를 잡아 과대해지지 않게 한다.
  const ref = landscape ? H : W;
  const topPad = Math.round(H * (landscape ? 0.06 : 0.05));
  const fs = Math.round(ref * (landscape ? 0.062 : 0.058));
  const lineGap = Math.round(fs * 1.28);
  const lines = [cap.line1, cap.line2].filter(Boolean);
  const font = `'Apple SD Gothic Neo','Pretendard','Noto Sans KR',sans-serif`;

  const texts = lines
    .map((ln, i) => {
      const y = topPad + fs + i * lineGap;
      const isAccent = lines.length > 1 && i === lines.length - 1;
      const fill = isAccent ? COLORS.accent : COLORS.headline;
      return `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="${font}" font-weight="800" font-size="${fs}" fill="${fill}" letter-spacing="-1">${xmlEscape(ln)}</text>`;
    })
    .join('');

  const barY = topPad + fs + (lines.length - 1) * lineGap + Math.round(fs * 0.5);
  const barW = Math.round(ref * 0.09);
  const bar = `<rect x="${(W - barW) / 2}" y="${barY}" width="${barW}" height="${Math.max(6, Math.round(H * 0.006))}" rx="6" fill="${COLORS.accent}"/>`;

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${texts}${bar}</svg>`;
  const headlineBottomY = barY + Math.round(H * 0.03);
  return { svg: Buffer.from(svg), headlineBottomY };
}

async function roundCorners(buf, w, h, r) {
  const mask = Buffer.from(
    `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}"/></svg>`
  );
  return sharp(buf).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

async function compose(rawPath, cap, t) {
  const { W, H, landscape } = t;
  const base = await sharp(backgroundSvg(W, H)).png().toBuffer();
  const { svg: headSvg, headlineBottomY } = headlineSvg(W, H, cap, landscape);

  const bottomPad = Math.round(H * (landscape ? 0.06 : 0.035));
  const sideMargin = Math.round(W * (landscape ? 0.05 : 0.065));
  const areaTop = headlineBottomY;
  const areaBottom = H - bottomPad;
  const maxW = W - 2 * sideMargin;
  const maxH = areaBottom - areaTop;

  const meta = await sharp(rawPath).metadata();
  const scale = Math.min(maxW / meta.width, maxH / meta.height);
  const sw = Math.round(meta.width * scale);
  const sh = Math.round(meta.height * scale);
  const sx = Math.round((W - sw) / 2);
  const sy = Math.round(areaTop + (maxH - sh) / 2);
  const radius = Math.round(Math.min(sw, sh) * 0.045);

  const shotResized = await sharp(rawPath).resize(sw, sh, { fit: 'fill' }).toBuffer();
  const shotRounded = await roundCorners(shotResized, sw, sh, radius);

  const pad = Math.round(Math.min(sw, sh) * 0.06);
  const shadowSvg = Buffer.from(
    `<svg width="${sw + pad * 2}" height="${sh + pad * 2}"><rect x="${pad}" y="${pad + Math.round(pad * 0.2)}" width="${sw}" height="${sh}" rx="${radius}" fill="rgba(60,30,25,0.22)"/></svg>`
  );
  const shadow = await sharp(shadowSvg).blur(Math.max(18, Math.round(pad * 0.6))).png().toBuffer();

  return sharp(base)
    .composite([
      { input: shadow, left: sx - pad, top: sy - pad },
      { input: shotRounded, left: sx, top: sy },
      { input: headSvg, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
}

function rawFiles(dir) {
  return readdirSync(dir)
    .filter((f) => extname(f).toLowerCase() === '.png')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => ({ base: basename(f, '.png'), path: join(dir, f), name: f }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseRaw = resolve(args.raw || join(MOBILE, 'store/raw-screenshots'));

  for (const tName of args.targets) {
    const t = TARGETS[tName];
    if (!t) throw new Error(`알 수 없는 타깃: ${tName}`);
    const rawDir = join(baseRaw, t.raw);
    if (!existsSync(rawDir)) throw new Error(`원본 폴더 없음: ${rawDir}`);
    const outDir = args.dry ? join(REPO, '.context/out', tName) : t.out;
    mkdirSync(outDir, { recursive: true });

    const files = rawFiles(rawDir).filter((f) => CAPTIONS[f.base] && (!t.screens || t.screens.includes(f.base)));
    console.log(`\n[${tName}] ${t.W}×${t.H} ← ${t.raw} (${files.length}장) → ${outDir.replace(REPO + '/', '')}`);
    for (const f of files) {
      const buf = await compose(f.path, CAPTIONS[f.base], t);
      await sharp(buf).png().toFile(join(outDir, f.name));
      console.log(`  ✓ ${f.name}  "${CAPTIONS[f.base].line1} ${CAPTIONS[f.base].line2 ?? ''}".trim()`);
    }
  }
  console.log('\n완료.');
}

main().catch((e) => {
  console.error('실패:', e);
  process.exit(1);
});
