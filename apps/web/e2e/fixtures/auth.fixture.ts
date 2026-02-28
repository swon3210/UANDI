import { test as base, type Page } from '@playwright/test';
import {
  clearEmulatorData,
  createTestUser,
  seedUserDocument,
  seedCoupleWithTwoMembers,
} from '../helpers/emulator';

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';
const PASSWORD = 'testpassword123';

// 브라우저에서 Firebase Auth Emulator로 이메일/비밀번호 로그인
// 앱이 에뮬레이터 모드일 때 config.ts에서 window.__auth를 노출함
async function signInOnPage(page: Page, email: string, password: string) {
  await page.evaluate(
    async ({ email, password }) => {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword((window as any).__auth, email, password);
    },
    { email, password }
  );
}

type Fixtures = {
  // 로그인 O, coupleId 없음 → 온보딩 테스트용
  noCoupleAuthedPage: Page;
  // 로그인 O, coupleId 있음 → 대시보드 / 사진 / 가계부 테스트용
  authedPage: Page;
};

export const test = base.extend<Fixtures>({
  noCoupleAuthedPage: async ({ page }, use) => {
    await clearEmulatorData();
    const uid = await createTestUser(EMAIL_1, PASSWORD);
    await seedUserDocument(uid, EMAIL_1, null);

    await page.goto('/');
    await signInOnPage(page, EMAIL_1, PASSWORD);
    await page.waitForURL('**/onboarding');

    await use(page);
  },

  authedPage: async ({ page }, use) => {
    await clearEmulatorData();
    const uid1 = await createTestUser(EMAIL_1, PASSWORD);
    const uid2 = await createTestUser(EMAIL_2, PASSWORD);
    const coupleId = await seedCoupleWithTwoMembers(uid1, uid2);
    await seedUserDocument(uid1, EMAIL_1, coupleId);
    await seedUserDocument(uid2, EMAIL_2, coupleId);

    await page.goto('/');
    await signInOnPage(page, EMAIL_1, PASSWORD);
    await page.waitForURL('/');

    await use(page);
  },
});
