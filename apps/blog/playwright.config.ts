import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// .env.test 파일에서 환경변수를 로드 (apps/web/playwright.config.ts와 같은 방식)
function loadEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    const content = readFileSync(resolve(__dirname, filePath), 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (key) env[key] = rest.join('=');
    }
  } catch {
    // 파일 없으면 무시
  }
  return env;
}

const testEnv = loadEnvFile('.env.test');

// E2E 전용 포트 — 수동 dev 서버(3002), web E2E(3100)와 충돌 방지
const E2E_PORT = 3102;

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: './e2e/specs',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  // dev 서버가 tiptap·firebase 청크를 처음 컴파일할 때 수십 초가 걸린다.
  timeout: 90000,
  expect: { timeout: 20000 },
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm next dev --port ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] != null)
      ),
      ...testEnv,
    },
  },
});
