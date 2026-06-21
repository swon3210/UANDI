/**
 * Play Store 출시용 그래픽 에셋 생성 스크립트 (마스코트 브랜드)
 *
 *   1) 앱 아이콘  512×512 PNG (알파 없음) — 기니피그 마스코트 앱 아이콘 마스터에서 리사이즈
 *   2) Feature Graphic 1024×500 PNG (알파 없음) — 코랄·세이지 마스코트 커플 + "MOA" 워드마크
 *
 * 소스 마스코트 PNG 는 `assets/mascot/` 에 있고, 출력 PNG 와 마스터 SVG 는
 * `apps/mobile/assets/store/` 에 저장된다. 모바일 런처 아이콘
 * (`apps/mobile/assets/images/icon.png`)과는 별도지만 동일한 마스코트 디자인이다.
 *
 * Usage: node scripts/generate-store-assets.mjs
 *
 * 사전 요구: pnpm add -Dw sharp @resvg/resvg-js pretendard
 */
import { createRequire } from 'module';
import { writeFileSync, readFileSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'apps/mobile/assets/store');
const MASCOT_DIR = join(ROOT, 'assets/mascot');
// play-listing.mjs push 가 실제로 업로드하는 위치 (icon/ 512×512, featureGraphic/ 1024×500)
const LISTING_IMG_DIR = join(ROOT, 'apps/mobile/store/listings/ko-KR/images');

// ── 브랜드 토큰 ──────────────────────────────────────────────────────────────
const CORAL = '#E8837A'; // --primary
const CORAL_DEEP = '#DD7368'; // 워드마크
const CORAL_TAG = '#C45F54'; // 헤드라인 카피
const CREAM = '#FFF7F3';
const PEACH = '#FBDDD2'; // 배경 우하단
const MUTED = '#94837B'; // 보조 카피

// ── 하트 경로 (Logo.tsx 와 동일 — 48×48 좌표계) ─────────────────────────────
const HEART_PATH = [
  'M24 10',
  'C23.5 7 21 3.5 16.5 3.5',
  'C9 3.5 3.5 9 3.5 16',
  'C3.5 24 15 33 22 36.5',
  'Q24 38 26 36.5',
  'C33 33 44.5 24 44.5 16',
  'C44.5 9 39 3.5 31.5 3.5',
  'C27 3.5 24.5 7 24 10Z',
].join('');

// ── 폰트 경로 (Pretendard) ──────────────────────────────────────────────────
const FONT_DIR = join(ROOT, 'node_modules/pretendard/dist/public/static');

/** PNG 파일을 data URI 로 (resvg <image> 임베드용) */
function pngDataUri(absPath) {
  const b64 = readFileSync(absPath).toString('base64');
  return `data:image/png;base64,${b64}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// A. 앱 아이콘 512×512 — 마스코트 앱 아이콘 마스터를 그대로 사용
// ─────────────────────────────────────────────────────────────────────────────
async function renderIcon(outPath) {
  await sharp(join(MASCOT_DIR, 'mascot-app-icon-master.png'))
    .resize(512, 512)
    .flatten({ background: CORAL })
    .png()
    .toFile(outPath);
  console.log('✓ apps/mobile/assets/store/icon-512.png (512×512)');
  copyToListing(outPath, 'icon', 'icon.png');
}

/** 마스터 PNG 를 push 가 읽는 listings/.../images/<type>/ 폴더로 복사 */
function copyToListing(srcPath, imageType, fileName) {
  const dir = join(LISTING_IMG_DIR, imageType);
  mkdirSync(dir, { recursive: true });
  copyFileSync(srcPath, join(dir, fileName));
  console.log(`  ↳ store/listings/ko-KR/images/${imageType}/${fileName}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Feature Graphic 1024×500 마스터 SVG
// ─────────────────────────────────────────────────────────────────────────────
// 좌측~중앙: 코랄·세이지 마스코트 커플(서로 기댄 모습) + 머리 위 하트
// 우측: "MOA" 워드마크 + 카피. 핵심 요소는 중앙~우측에 배치.
function featureGraphicSvg() {
  const coral = pngDataUri(join(MASCOT_DIR, 'mascot-coral-master.png'));
  const sage = pngDataUri(join(MASCOT_DIR, 'mascot-sage-master.png'));
  // 마스코트 원본 505×600 → 화면 표시 230×273 (비율 유지)
  const MW = 230;
  const MH = 273;

  return `<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${CREAM}"/>
      <stop offset="100%" stop-color="${PEACH}"/>
    </linearGradient>
    <radialGradient id="glow" cx="32%" cy="55%" r="48%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- 배경 -->
  <rect width="1024" height="500" fill="url(#bg)"/>

  <!-- 배경 데코 하트 (은은하게) -->
  <g fill="${CORAL}">
    <g transform="translate(840 60) scale(2.4)" opacity="0.10"><path d="${HEART_PATH}"/></g>
    <g transform="translate(930 330) scale(1.6)" opacity="0.10"><path d="${HEART_PATH}"/></g>
    <g transform="translate(610 380) scale(1.1)" opacity="0.09"><path d="${HEART_PATH}"/></g>
  </g>

  <!-- 마스코트 뒤 부드러운 글로우 -->
  <ellipse cx="300" cy="300" rx="260" ry="220" fill="url(#glow)"/>

  <!-- 마스코트 커플 (세이지=뒤/우, 코랄=앞/좌) -->
  <image href="${sage}" x="255" y="180" width="${MW}" height="${MH}"/>
  <image href="${coral}" x="110" y="190" width="${MW}" height="${MH}"/>

  <!-- 머리 위 하트 -->
  <g transform="translate(266.4 118) scale(1.4)" fill="${CORAL}">
    <path d="${HEART_PATH}"/>
  </g>

  <!-- 우측: 워드마크 + 카피 -->
  <text x="610" y="252"
        font-family="Pretendard" font-weight="800" font-size="118"
        fill="${CORAL_DEEP}" letter-spacing="2">MOA</text>

  <text x="614" y="312"
        font-family="Pretendard" font-weight="700" font-size="32"
        fill="${CORAL_TAG}">함께 모아가는 즐거움</text>

  <text x="614" y="352"
        font-family="Pretendard" font-weight="500" font-size="23"
        fill="${MUTED}">둘이 함께 쓰는 커플 가계부</text>
</svg>`;
}

/** 텍스트·임베드 이미지 포함 SVG → resvg-js 로 PNG (Pretendard 로드) + sharp 로 알파 제거 */
async function renderFeatureGraphic(svgString, outPath) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: 1024 },
    font: {
      fontFiles: [
        join(FONT_DIR, 'Pretendard-Medium.otf'),
        join(FONT_DIR, 'Pretendard-Bold.otf'),
        join(FONT_DIR, 'Pretendard-ExtraBold.otf'),
      ],
      loadSystemFonts: false,
      defaultFontFamily: 'Pretendard',
    },
  });
  const pngBuffer = resvg.render().asPng();
  await sharp(pngBuffer).flatten({ background: CREAM }).png().toFile(outPath);
  console.log('✓ apps/mobile/assets/store/feature-graphic-1024x500.png (1024×500)');
  copyToListing(outPath, 'featureGraphic', 'feature-graphic.png');
}

// ─────────────────────────────────────────────────────────────────────────────
// 실행
// ─────────────────────────────────────────────────────────────────────────────
const featureSvg = featureGraphicSvg();

writeFileSync(join(OUT_DIR, 'feature-graphic-master.svg'), featureSvg, 'utf8');
console.log('✓ apps/mobile/assets/store/feature-graphic-master.svg');

await renderIcon(join(OUT_DIR, 'icon-512.png'));
await renderFeatureGraphic(featureSvg, join(OUT_DIR, 'feature-graphic-1024x500.png'));

console.log('\n✅ Store assets generated!');
