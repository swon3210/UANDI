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

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',
  testDir: './e2e/specs',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'html',
  ...(isHeaded && { timeout: 60000 }),
  use: {
    baseURL: 'http://localhost:3000',
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
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter(
          (entry): entry is [string, string] => entry[1] != null
        )
      ),
      ...testEnv,
    },
  },
});
