/**
 * Play Store 출시용 그래픽 에셋 생성 스크립트
 *
 *   1) 앱 아이콘  512×512 PNG (알파 없음, 단색 배경)
 *   2) Feature Graphic 1024×500 PNG (알파 없음)
 *
 * 마스터 SVG 와 출력 PNG 는 `apps/mobile/assets/store/` 에 저장된다.
 * 모바일 런처 아이콘(`apps/mobile/assets/images/icon.png`)과는 별도.
 *
 * Usage: node scripts/generate-store-assets.mjs
 *
 * 사전 요구: pnpm add -Dw sharp @resvg/resvg-js pretendard
 */
import { createRequire } from 'module';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'apps/mobile/assets/store');

// ── 브랜드 토큰 ──────────────────────────────────────────────────────────────
const CORAL = '#E8837A';
// 그라데이션: 좌상단은 피치/살구톤, 우하단은 따뜻한 코랄
const CORAL_PEACH = '#F4B0A2'; // 살짝 살구 섞은 밝은 코랄
const CORAL_WARM = '#DC7065'; // 따뜻한 진한 코랄
// 하트/텍스트: 순백 대신 살짝 크림톤
const CREAM = '#FFF8F3';

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

// ─────────────────────────────────────────────────────────────────────────────
// A. 앱 아이콘 512×512 마스터 SVG
// ─────────────────────────────────────────────────────────────────────────────
// 풀블리드 코랄 배경 + 중앙 크림톤 하트 (캔버스의 ~68%, 세이프존 80% 내부)
//   - 하트 path bbox: x[3.5, 44.5], y[3.5, 38]. bbox 중심은 (24, 20.75)로 viewBox
//     중심(24,24)보다 살짝 위쪽에 있어 그대로 두면 세로 중앙정렬이 어긋남.
//   - scale=7.25 적용 후 bbox 크기 ≈ 297.25×250.13.
//   - bbox 중심을 캔버스 중심(256,256)에 맞추는 translate:
//       tx = 256 - 24*7.25 = 82
//       ty = 256 - 20.75*7.25 = 105.5625
// 따뜻한 분위기를 위해 배경에도 살짝 그라데이션 (코랄 → 따뜻한 코랄).
function appIconSvg() {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${CORAL_PEACH}"/>
      <stop offset="100%" stop-color="${CORAL_WARM}"/>
    </linearGradient>
    <radialGradient id="iconGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${CREAM}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${CREAM}" stop-opacity="0"/>
    </radialGradient>
    <!-- 하트 자체에 적용할 부드러운 vertical gradient (상단 살짝 밝게) -->
    <linearGradient id="heartFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFCF8"/>
      <stop offset="100%" stop-color="${CREAM}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#iconBg)"/>
  <!-- 중앙 부드러운 글로우 -->
  <circle cx="256" cy="256" r="220" fill="url(#iconGlow)"/>
  <!-- 크림톤 하트 (path bbox 기준 정중앙 정렬) -->
  <g transform="translate(82 105.5625) scale(7.25)">
    <path d="${HEART_PATH}" fill="url(#heartFill)"/>
  </g>
</svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Feature Graphic 1024×500 마스터 SVG
// ─────────────────────────────────────────────────────────────────────────────
// 좌측 1/3 (0~340)은 안드로이드 UI에 가려질 수 있으므로 핵심 요소는 중앙~우측에.
//   - 배경: 살짝 밝은 코랄 → 살짝 진한 코랄 대각선 그라데이션
//   - 좌측: 흐릿한 하트 패턴 (opacity 0.08) — 데코레이션
//   - 중앙~우측:
//       하트 아이콘 (높이 ~200px, x≈400~600)
//       "UANDI" 워드마크 (Pretendard ExtraBold, ~88px)
//       카피 "둘이서 만드는 우리만의 일상" (Pretendard Medium, 32px, 흰색 opacity 0.95)
function featureGraphicSvg() {
  return `<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 따뜻한 피치 → 코랄 대각선 그라데이션 -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${CORAL_PEACH}"/>
      <stop offset="100%" stop-color="${CORAL_WARM}"/>
    </linearGradient>
    <!-- 중앙 하트 뒤 부드러운 글로우 -->
    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${CREAM}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${CREAM}" stop-opacity="0"/>
    </radialGradient>
    <!-- 하트 fill — 상단 약간 밝게로 부드러운 입체감 -->
    <linearGradient id="heartFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFCF8"/>
      <stop offset="100%" stop-color="${CREAM}"/>
    </linearGradient>
  </defs>

  <!-- 배경 -->
  <rect width="1024" height="500" fill="url(#bg)"/>

  <!-- 좌측 데코 하트 (배경에 따뜻하게 녹아드는 느낌) -->
  <g transform="translate(40 90) scale(3.0)" opacity="0.15">
    <path d="${HEART_PATH}" fill="${CREAM}"/>
  </g>
  <g transform="translate(160 290) scale(2.0)" opacity="0.13">
    <path d="${HEART_PATH}" fill="${CREAM}"/>
  </g>
  <g transform="translate(280 60) scale(1.2)" opacity="0.12">
    <path d="${HEART_PATH}" fill="${CREAM}"/>
  </g>

  <!-- 중앙 하트 뒤 글로우 -->
  <ellipse cx="500" cy="250" rx="280" ry="220" fill="url(#centerGlow)"/>

  <!-- 중앙: 하트 아이콘 (~200×200, 크림톤 + 부드러운 수직 그라데이션) -->
  <g transform="translate(400 150) scale(4.2)">
    <path d="${HEART_PATH}" fill="url(#heartFill)"/>
  </g>

  <!-- 우측: 워드마크 + 카피 -->
  <text x="630" y="240"
        font-family="Pretendard"
        font-weight="800"
        font-size="96"
        fill="${CREAM}"
        letter-spacing="4">UANDI</text>

  <text x="630" y="300"
        font-family="Pretendard"
        font-weight="500"
        font-size="30"
        fill="${CREAM}"
        opacity="0.96">둘이서 만드는 우리만의 일상</text>
</svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 렌더링
// ─────────────────────────────────────────────────────────────────────────────

/** 텍스트 없는 SVG → sharp 로 PNG (알파 제거).
 *  sharp(librsvg)는 radialGradient/linearGradient를 잘 지원하지만,
 *  resvg-js가 그래디언트 정밀도가 더 높아 일관성을 위해 두 에셋 모두 resvg로 변환. */
async function renderWithSharp(svgString, outPath, size) {
  await sharp(Buffer.from(svgString))
    .resize(size.width, size.height)
    .flatten({ background: CORAL })
    .png()
    .toFile(outPath);
}

/** 텍스트 포함 SVG → resvg-js 로 PNG (Pretendard 로드) + sharp 로 알파 제거 */
async function renderWithResvg(svgString, outPath, size) {
  const fontFiles = [
    join(FONT_DIR, 'Pretendard-Medium.otf'),
    join(FONT_DIR, 'Pretendard-ExtraBold.otf'),
  ];

  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'width', value: size.width },
    font: {
      fontFiles,
      loadSystemFonts: false,
      defaultFontFamily: 'Pretendard',
    },
  });

  const pngBuffer = resvg.render().asPng();

  // resvg-js 는 알파가 남을 수 있으므로 sharp 로 flatten
  await sharp(pngBuffer).flatten({ background: CORAL }).png().toFile(outPath);
}

// ─────────────────────────────────────────────────────────────────────────────
// 실행
// ─────────────────────────────────────────────────────────────────────────────

const iconSvg = appIconSvg();
const featureSvg = featureGraphicSvg();

// 1) 마스터 SVG 저장 (재현·수정용)
writeFileSync(join(OUT_DIR, 'icon-master.svg'), iconSvg, 'utf8');
writeFileSync(join(OUT_DIR, 'feature-graphic-master.svg'), featureSvg, 'utf8');
console.log('✓ apps/mobile/assets/store/icon-master.svg');
console.log('✓ apps/mobile/assets/store/feature-graphic-master.svg');

// 2) PNG 생성
await renderWithSharp(iconSvg, join(OUT_DIR, 'icon-512.png'), {
  width: 512,
  height: 512,
});
console.log('✓ apps/mobile/assets/store/icon-512.png (512×512)');

await renderWithResvg(featureSvg, join(OUT_DIR, 'feature-graphic-1024x500.png'), {
  width: 1024,
  height: 500,
});
console.log('✓ apps/mobile/assets/store/feature-graphic-1024x500.png (1024×500)');

console.log('\n✅ Store assets generated!');
