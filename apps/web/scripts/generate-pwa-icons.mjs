// PWA 아이콘 PNG 생성기 (1회 실행 후 산출물은 public/icons/에 커밋)
// 실행: node apps/web/scripts/generate-pwa-icons.mjs
//
// public/brand/logo-app-icon.svg (any), public/icons/favicon.svg 를 기반으로
// 192/512 사이즈 PWA PNG를 생성한다. (MOA 브랜드 에셋)

import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');
const BRAND_DIR = join(__dirname, '..', 'public', 'brand');

// maskable PNG는 디자인 핸드오프(pwa-maskable-512.png, 세이프존 적용)에서
// 직접 제공되므로 여기서는 "any" 용도의 pwa-192/512 만 재생성한다.
const TARGETS = [
  { srcDir: BRAND_DIR, src: 'logo-app-icon.svg', out: 'pwa-192.png', size: 192 },
  { srcDir: BRAND_DIR, src: 'logo-app-icon.svg', out: 'pwa-512.png', size: 512 },
];

const browser = await chromium.launch();
try {
  for (const { srcDir, src, out, size } of TARGETS) {
    const svg = readFileSync(join(srcDir, src), 'utf-8');
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const html = `<!doctype html><html><head><style>
      html,body{margin:0;padding:0;width:${size}px;height:${size}px;}
      svg{display:block;width:${size}px;height:${size}px;}
    </style></head><body>${svg}</body></html>`;
    await page.setContent(html, { waitUntil: 'load' });
    const buf = await page.screenshot({
      type: 'png',
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size },
    });
    writeFileSync(join(ICONS_DIR, out), buf);
    console.log(`✓ ${out} (${size}×${size})`);
    await page.close();
  }
} finally {
  await browser.close();
}
