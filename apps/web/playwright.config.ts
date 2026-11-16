import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const isHeaded = process.argv.includes('--headed');

// .env.test 파일에서 환경변수를 로드
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

// 앱 전용 게이트(docs/pages/08-get-app.md)를 켠 채로 테스트한다. 모든 테스트는 기본적으로
// 앱(WebView) 요청으로 보이도록 UA 에 앱 표식을 붙이고, 게이트 자체를 검증하는 spec(app-gate)만
// test.use({ userAgent }) 로 일반 브라우저 UA 를 쓴다. 표식 문자열은 src/lib/app-gate.ts 와 같아야 한다.
const withAppMarker = (userAgent: string) => `${userAgent} UANDI-App/e2e`;

// E2E 전용 포트 — 수동 dev 서버(3000)와 충돌 방지
const E2E_PORT = 3100;

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: './e2e/specs',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'html',
  ...(isHeaded && { timeout: 60000 }),
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    trace: 'on-first-retry',
    ...(isHeaded && {
      launchOptions: { slowMo: 1000 },
      actionTimeout: 30000,
    }),
  },
  ...(isHeaded && {
    expect: { timeout: 30000 },
  }),
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        userAgent: withAppMarker(devices['Desktop Chrome'].userAgent),
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        userAgent: withAppMarker(devices['Pixel 5'].userAgent),
      },
    },
  ],
  webServer: {
    command: `pnpm next dev --port ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter(
          (entry): entry is [string, string] => entry[1] != null
        )
      ),
      ...testEnv,
      APP_ONLY_GATE: 'on',
    },
  },
});
