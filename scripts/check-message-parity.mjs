#!/usr/bin/env node
/**
 * ko/en 메시지 파일 정합성 검사.
 *
 *   apps/web/messages/ko/*.json 과 en/*.json 이
 *   - 같은 파일 집합을 갖고
 *   - 같은 키 집합(중첩 포함)을 갖고
 *   - 같은 ICU 인자({code} 같은 placeholder)를 쓰고
 *   - 값이 비어 있지 않은지
 * 확인한다. 하나라도 어긋나면 exit 1.
 *
 * 사용: node scripts/check-message-parity.mjs
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MESSAGES_DIR = join(ROOT, 'apps/web/messages');
const BASE = 'ko';

const locales = readdirSync(MESSAGES_DIR).filter(
  (d) => existsSync(join(MESSAGES_DIR, d)) && !d.includes('.')
);
if (!locales.includes(BASE)) {
  console.error(`✗ 기준 로케일 디렉토리가 없습니다: ${join(MESSAGES_DIR, BASE)}`);
  process.exit(1);
}

function listFiles(locale) {
  return readdirSync(join(MESSAGES_DIR, locale))
    .filter((f) => f.endsWith('.json'))
    .sort();
}

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

function icuArgs(value) {
  if (typeof value !== 'string') return [];
  // {name} / {count, plural, …} / {date, date, short} — 첫 식별자만 인자 이름
  return [...value.matchAll(/\{\s*([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]).sort();
}

const errors = [];
const baseFiles = listFiles(BASE);

for (const locale of locales) {
  if (locale === BASE) continue;
  const files = listFiles(locale);
  for (const f of baseFiles)
    if (!files.includes(f)) errors.push(`${locale}/${f} 파일이 없습니다 (${BASE} 에는 있음)`);
  for (const f of files)
    if (!baseFiles.includes(f)) errors.push(`${locale}/${f} 파일이 ${BASE} 에는 없습니다`);

  for (const f of baseFiles) {
    if (!files.includes(f)) continue;
    const base = flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, BASE, f), 'utf8')));
    const other = flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, locale, f), 'utf8')));

    for (const key of Object.keys(base)) {
      if (!(key in other)) {
        errors.push(`${locale}/${f}: 키 누락 "${key}"`);
        continue;
      }
      const a = icuArgs(base[key]);
      const b = icuArgs(other[key]);
      if (a.join(',') !== b.join(',')) {
        errors.push(
          `${locale}/${f}: "${key}" ICU 인자 불일치 (${BASE}: {${a}} / ${locale}: {${b}})`
        );
      }
      if (typeof other[key] === 'string' && other[key].trim() === '') {
        errors.push(`${locale}/${f}: "${key}" 값이 비어 있습니다`);
      }
    }
    for (const key of Object.keys(other)) {
      if (!(key in base)) errors.push(`${locale}/${f}: ${BASE} 에 없는 키 "${key}"`);
    }
  }
}

for (const f of baseFiles) {
  const base = flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, BASE, f), 'utf8')));
  for (const [key, v] of Object.entries(base)) {
    if (typeof v === 'string' && v.trim() === '')
      errors.push(`${BASE}/${f}: "${key}" 값이 비어 있습니다`);
  }
}

if (errors.length > 0) {
  console.error(`✗ 메시지 파일 불일치 ${errors.length}건:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const keyCount = baseFiles.reduce(
  (n, f) =>
    n + Object.keys(flatten(JSON.parse(readFileSync(join(MESSAGES_DIR, BASE, f), 'utf8')))).length,
  0
);
console.log(
  `✓ 메시지 파일 정합 (${locales.join(', ')} / ${baseFiles.length}개 파일, ${keyCount}개 키)`
);
