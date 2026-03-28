/**
 * 로고 SVG → PNG 아이콘 생성 스크립트
 * Usage: node scripts/generate-icons.mjs
 *
 * 사전 요구: pnpm add -D sharp --filter web
 */
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const CORAL = '#E8837A';

// ── 하트 경로 (Logo.tsx와 동일) ──────────────────────────────────────────────
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

// ── SVG 생성 함수들 ─────────────────────────────────────────────────────────

/** app-icon: 코랄 배경 + 흰 하트 */
function appIconSvg(size) {
  return Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="${CORAL}"/>
  <path d="${HEART_PATH}" fill="white"/>
</svg>`);
}

/** app-icon with rounded corners */
function appIconRoundedSvg(size) {
  return Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="10" fill="${CORAL}"/>
  <path d="${HEART_PATH}" fill="white"/>
</svg>`);
}

/** Android foreground: 흰 하트 on transparent */
function androidForegroundSvg(size) {
  return Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 108 108" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(30, 28) scale(1.0)">
    <path d="${HEART_PATH}" fill="white"/>
    <ellipse cx="14" cy="13" rx="5" ry="4.5" fill="white" opacity="0.3" transform="rotate(-20 14 13)"/>
  </g>
</svg>`);
}

/** Android background: 코랄 단색 */
function androidBackgroundSvg(size) {
  return Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 108 108" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="108" height="108" fill="${CORAL}"/>
</svg>`);
}

/** Android monochrome: 흰 하트 on transparent */
function androidMonochromeSvg(size) {
  return Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 108 108" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(30, 28) scale(1.0)">
    <path d="${HEART_PATH}" fill="white"/>
  </g>
</svg>`);
}

/** Splash icon: 코랄 하트 + 하이라이트 on transparent */
function splashIconSvg(size) {
  return Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${HEART_PATH}" fill="${CORAL}"/>
  <ellipse cx="14" cy="13" rx="5" ry="4.5" fill="white" opacity="0.3" transform="rotate(-20 14 13)"/>
</svg>`);
}

// ── 변환 타겟 ────────────────────────────────────────────────────────────────

const targets = [
  // Mobile assets
  { name: 'icon.png', dest: 'apps/mobile/assets/images', svg: splashIconSvg, size: 1024 },
  { name: 'favicon.png', dest: 'apps/mobile/assets/images', svg: splashIconSvg, size: 48 },
  { name: 'splash-icon.png', dest: 'apps/mobile/assets/images', svg: splashIconSvg, size: 1024 },
  { name: 'android-icon-foreground.png', dest: 'apps/mobile/assets/images', svg: androidForegroundSvg, size: 512 },
  { name: 'android-icon-background.png', dest: 'apps/mobile/assets/images', svg: androidBackgroundSvg, size: 512 },
  { name: 'android-icon-monochrome.png', dest: 'apps/mobile/assets/images', svg: androidMonochromeSvg, size: 432 },
  // Web favicon (Next.js App Router: app/icon.png → <link rel="icon">)
  { name: 'icon.png', dest: 'apps/web/src/app', svg: splashIconSvg, size: 180 },
];

// ── 실행 ─────────────────────────────────────────────────────────────────────

for (const t of targets) {
  const destPath = join(ROOT, t.dest, t.name);
  await sharp(t.svg(t.size)).resize(t.size, t.size).png().toFile(destPath);
  console.log(`✓ ${t.dest}/${t.name} (${t.size}×${t.size})`);
}

console.log('\n✅ All icons generated!');
