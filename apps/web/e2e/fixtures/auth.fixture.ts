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

type AuthContext = {
  page: Page;
  uid: string;
  coupleId: string;
};

type Fixtures = {
  // 로그인 O, coupleId 없음 → 온보딩 테스트용
  noCoupleAuthedPage: Page;
  // 로그인 O, coupleId 있음 → 대시보드 / 사진 / 가계부 테스트용
  authedPage: Page;
  // authedPage와 동일하지만 uid, coupleId도 함께 제공
  authedContext: AuthContext;
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

  authedPage: async ({ page, context }, use) => {
    await clearEmulatorData();
    // 이전 테스트에서 남은 쿠키 제거 (미들웨어가 잘못 리다이렉트하지 않도록)
    await context.clearCookies();

    const uid1 = await createTestUser(EMAIL_1, PASSWORD);
    const uid2 = await createTestUser(EMAIL_2, PASSWORD);
    const coupleId = await seedCoupleWithTwoMembers(uid1, uid2);
    await seedUserDocument(uid1, EMAIL_1, coupleId);
    await seedUserDocument(uid2, EMAIL_2, coupleId);

    await page.goto('/');
    await signInOnPage(page, EMAIL_1, PASSWORD);
    // 로그인 후 AuthInit이 coupleId를 감지하고 대시보드를 렌더링할 때까지 대기
    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 15000 });

    await use(page);
  },

  authedContext: async ({ page, context }, use) => {
    await clearEmulatorData();
    await context.clearCookies();

    const uid1 = await createTestUser(EMAIL_1, PASSWORD);
    const uid2 = await createTestUser(EMAIL_2, PASSWORD);
    const coupleId = await seedCoupleWithTwoMembers(uid1, uid2);
    await seedUserDocument(uid1, EMAIL_1, coupleId);
    await seedUserDocument(uid2, EMAIL_2, coupleId);

    await page.goto('/');
    await signInOnPage(page, EMAIL_1, PASSWORD);
    await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 15000 });

    await use({ page, uid: uid1, coupleId });
  },
});
