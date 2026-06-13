import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';

// Play Console 스토어 등록정보용 스크린샷 캡처 전용 Playwright 설정.
// 일반 E2E(playwright.config.ts, testDir: ./e2e/specs)와 분리해서
// `pnpm screenshots` 로만 실행한다. 같은 Firebase 에뮬레이터 + dev 서버를 쓴다.

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
const E2E_PORT = 3100;

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: './e2e/screenshots',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  // 테스트가 아니라 캡처 작업이라 리포트는 list 로 간단히.
  reporter: 'list',
  timeout: 180000,
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    // Play 폰 스크린샷 규격을 만족하는 세로형 뷰포트.
    //   디바이스 픽셀 = CSS 크기 × deviceScaleFactor = 1236×2400
    //   (각 변 320~3840px, 세로:가로 비율 ≤ 2:1 — 2400/1236 ≈ 1.94 만족)
    // CSS 너비 412 는 일반 폰과 같아 웹의 모바일 레이아웃이 그대로 렌더된다.
    viewport: { width: 412, height: 800 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },
  projects: [{ name: 'phone' }],
  webServer: {
    command: `pnpm next dev --port ${E2E_PORT}`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] != null)
      ),
      ...testEnv,
    },
  },
});
