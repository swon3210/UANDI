import { test, type Page } from '@playwright/test';
import {
  clearEmulatorData,
  createTestUser,
  seedUserDocument,
  seedCoupleWithTwoMembers,
} from '../helpers/emulator';

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';
const PASSWORD = 'testpassword123';

async function signInOnPage(page: Page, email: string, password: string) {
  await page.waitForFunction(
    () => typeof (window as any).__signInWithEmailAndPassword === 'function',
    { timeout: 10000 }
  );
  await page.evaluate(
    async ({ email, password }) => {
      const w = window as any;
      await w.__signInWithEmailAndPassword(w.__auth, email, password);
    },
    { email, password }
  );
}

test('debug: trace AuthInit', async ({ page, context }) => {
  await clearEmulatorData();
  await context.clearCookies();

  const uid1 = await createTestUser(EMAIL_1, PASSWORD);
  const uid2 = await createTestUser(EMAIL_2, PASSWORD);
  const coupleId = await seedCoupleWithTwoMembers(uid1, uid2);
  await seedUserDocument(uid1, EMAIL_1, coupleId);

  console.log('uid1:', uid1, 'coupleId:', coupleId);

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[AuthInit]')) {
      console.log('BROWSER:', text);
    }
  });

  await page.goto('/');
  await signInOnPage(page, EMAIL_1, PASSWORD);
  await page.waitForTimeout(5000);

  console.log('Current URL:', page.url());
});
