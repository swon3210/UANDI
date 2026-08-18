import { test as base, type Page } from '@playwright/test';
import {
  clearDiaryEntries,
  ensureTestUser,
  OWNER_EMAIL,
  OWNER_PASSWORD,
} from '../helpers/emulator';

type OwnerFixtures = {
  /** 주인 계정으로 로그인된 페이지 (/diary 진입 상태) */
  ownerPage: Page;
  ownerUid: string;
};

/**
 * Google 팝업 로그인은 apis.google.com이 필요해 E2E에서 쓰기 어렵다.
 * 에뮬레이터 모드에서만 열리는 테스트 훅(window.__signInWithEmailAndPassword)으로
 * 같은 Firebase 계정 상태를 만든다. (apps/web과 같은 방식)
 */
export async function signInAsOwner(page: Page, email = OWNER_EMAIL) {
  await page.goto('/diary');
  await page.waitForFunction(() => Boolean((window as unknown as Record<string, unknown>).__auth));
  await page.evaluate(
    async ({ email: userEmail, password }) => {
      const testWindow = window as unknown as {
        __auth: unknown;
        __signInWithEmailAndPassword: (auth: unknown, e: string, p: string) => Promise<unknown>;
      };
      await testWindow.__signInWithEmailAndPassword(testWindow.__auth, userEmail, password);
    },
    { email, password: OWNER_PASSWORD }
  );
}

export const test = base.extend<OwnerFixtures>({
  ownerUid: async ({}, use) => {
    await clearDiaryEntries();
    const uid = await ensureTestUser(OWNER_EMAIL);
    await use(uid);
  },
  ownerPage: async ({ page, ownerUid: _ownerUid }, use) => {
    await signInAsOwner(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
