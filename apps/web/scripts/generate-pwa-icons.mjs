// PWA 아이콘 PNG 생성기 (1회 실행 후 산출물은 public/icons/에 커밋)
// 실행: node apps/web/scripts/generate-pwa-icons.mjs
//
// public/icons/icon.svg, icon-maskable.svg 를 기반으로
// 192/512 사이즈 PNG를 생성한다.

import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');

const TARGETS = [
  { src: 'icon.svg', out: 'icon-192.png', size: 192 },
  { src: 'icon.svg', out: 'icon-512.png', size: 512 },
  { src: 'icon-maskable.svg', out: 'icon-maskable-192.png', size: 192 },
  { src: 'icon-maskable.svg', out: 'icon-maskable-512.png', size: 512 },
];

const browser = await chromium.launch();
try {
  for (const { src, out, size } of TARGETS) {
    const svg = readFileSync(join(ICONS_DIR, src), 'utf-8');
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
