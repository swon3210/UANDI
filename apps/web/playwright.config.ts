import { defineConfig, devices } from '@playwright/test';

const isHeaded = process.argv.includes('--headed');

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    ...(isHeaded && { launchOptions: { slowMo: 500 } }),
  },
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
    env: {
      ...process.env,
      NEXT_PUBLIC_FIREBASE_USE_EMULATOR: 'true',
    },
  },
});
