// 말랑 가계부 모바일 앱 아이콘/스플래시 생성기 (1회 실행 후 산출물은 assets/에 커밋)
// 실행: node apps/mobile/scripts/generate-app-icons.mjs
//
// 디자인 핸드오프(말랑 가계부 브랜드 에셋)의 source SVG를 기반으로
// Expo 앱 아이콘 / 적응형 아이콘 / 스플래시 / 스토어 이미지를 생성한다.
//
// 색상 토큰
//   배경 stone-50  #FAFAF8
//   아이콘 배경 coral-50 #FEF3F2

import sharp from 'sharp';
import { readFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const BUNDLE = join(ROOT, '.context', 'moa-assets', 'design_handoff_brand_assets');
const SRC = join(BUNDLE, 'source');
const IMAGES = join(__dirname, '..', 'assets', 'images');
const STORE = join(__dirname, '..', 'assets', 'store');

const CORAL_50 = { r: 0xfe, g: 0xf3, b: 0xf2, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const emblemSvg = readFileSync(join(SRC, 'logo-icon.svg'), 'utf-8');
// 모노크롬: 모든 fill을 검정 실루엣으로 치환 (Android 적응형 monochrome 레이어용)
const monoSvg = emblemSvg
  .replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#000000"')
  .replace(/opacity="0\.92"/g, 'opacity="1"');

// SVG 문자열 → 정사각 투명 PNG 버퍼
async function renderSvg(svg, size) {
  return sharp(Buffer.from(svg), { density: 512 })
    .resize(size, size, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer();
}

// 엠블럼을 세이프존 안에 배치한 정사각 PNG 파일 생성
async function composeCentered(emblem, canvas, emblemSize, out) {
  const fg = await renderSvg(emblem, emblemSize);
  await sharp({
    create: { width: canvas, height: canvas, channels: 4, background: TRANSPARENT },
  })
    .composite([{ input: fg, gravity: 'center' }])
    .png()
    .toFile(out);
  console.log(`✓ ${out.replace(ROOT + '/', '')}`);
}

// 1) 앱 아이콘 1024 — 불투명 풀스퀘어 (iOS 아이콘은 알파 금지, 라운딩은 OS가 적용)
//    디자인의 라운드 스퀘어(투명 모서리)를 같은 coral-50으로 flatten 해 모서리를 채운다.
await sharp(join(BUNDLE, 'icons', 'app-icon-1024.png'))
  .flatten({ background: CORAL_50 })
  .removeAlpha()
  .png()
  .toFile(join(IMAGES, 'icon.png'));
console.log('✓ assets/images/icon.png (opaque)');

// 2) 웹 파비콘 48
copyFileSync(join(BUNDLE, 'icons', 'favicon-48.png'), join(IMAGES, 'favicon.png'));
console.log('✓ assets/images/favicon.png');

// 3) 스플래시 아이콘 1024 — 투명 엠블럼 (resizeMode contain, 배경은 app.json에서 지정)
await sharp(await renderSvg(emblemSvg, 1024))
  .png()
  .toFile(join(IMAGES, 'splash-icon.png'));
console.log('✓ assets/images/splash-icon.png');

// 4) Android 적응형 foreground 512 — 세이프존(~66%) 안에 엠블럼
await composeCentered(emblemSvg, 512, 300, join(IMAGES, 'android-icon-foreground.png'));

// 5) Android 적응형 background 512 — coral-50 단색
await sharp({ create: { width: 512, height: 512, channels: 4, background: CORAL_50 } })
  .png()
  .toFile(join(IMAGES, 'android-icon-background.png'));
console.log('✓ assets/images/android-icon-background.png');

// 6) Android 적응형 monochrome 432 — 엠블럼 단색 실루엣 (세이프존)
await composeCentered(monoSvg, 432, 252, join(IMAGES, 'android-icon-monochrome.png'));

// 7) 스토어 아이콘 512 — 불투명 풀스퀘어 (스토어 아이콘도 알파 없이 제출)
await sharp(join(BUNDLE, 'icons', 'app-icon-1024.png'))
  .flatten({ background: CORAL_50 })
  .removeAlpha()
  .resize(512, 512)
  .png()
  .toFile(join(STORE, 'icon-512.png'));
console.log('✓ assets/store/icon-512.png (opaque)');

// 8) 스토어 피처 그래픽 1024×500
copyFileSync(
  join(BUNDLE, 'intro', 'intro-feature-1024x500.png'),
  join(STORE, 'feature-graphic-1024x500.png')
);
console.log('✓ assets/store/feature-graphic-1024x500.png');

// 9) 스토어 마스터 SVG — 앱 아이콘 원본 교체
copyFileSync(join(SRC, 'logo-app-icon.svg'), join(STORE, 'icon-master.svg'));
console.log('✓ assets/store/icon-master.svg');

console.log('\n완료. app.json 의 배경색(#FEF3F2 / #FAFAF8)도 확인하세요.');
