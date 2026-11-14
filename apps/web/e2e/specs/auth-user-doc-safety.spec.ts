import { expect, test as base, type Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  clearEmulatorData,
  createTestUser,
  getUserCoupleId,
  seedCoupleWithTwoMembers,
  seedUserDocument,
} from '../helpers/emulator';

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';
const PASSWORD = 'testpassword123';

// 앱(에뮬레이터 모드)이 노출하는 로그인 함수로 이메일 로그인
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

// Firestore 통신(WebChannel)만 끊는다 — Auth 에뮬레이터는 그대로 둬 로그인은 성공한다
const FIRESTORE_ROUTE = '**/google.firestore.v1.Firestore/**';

base.describe('로그인 시 사용자 문서 보호', () => {
  base(
    '사용자 문서를 못 읽어도 기존 coupleId를 덮어쓰지 않고 재시도 화면을 보여준다',
    async ({ page, context }) => {
      base.setTimeout(90000);
      await clearEmulatorData();
      await context.clearCookies();
      const uid1 = await createTestUser(EMAIL_1, PASSWORD);
      const uid2 = await createTestUser(EMAIL_2, PASSWORD);
      const coupleId = await seedCoupleWithTwoMembers(uid1, uid2);
      await seedUserDocument(uid1, EMAIL_1, coupleId);
      await seedUserDocument(uid2, EMAIL_2, coupleId);
      await context.addInitScript(() => {
        window.localStorage.setItem('moa:tour:v1', 'true');
      });

      await page.goto('/');
      // "client is offline" 상황 재현: 로그인 직후 users 문서 읽기가 실패한다
      await page.route(FIRESTORE_ROUTE, (route) => route.abort());
      await signInOnPage(page, EMAIL_1, PASSWORD);

      await expect(page.getByTestId('auth-load-error')).toBeVisible({ timeout: 45000 });
      expect(await getUserCoupleId(uid1)).toBe(coupleId);

      // 통신이 돌아오면 다시 시도로 원래 커플의 대시보드에 들어간다
      await page.unroute(FIRESTORE_ROUTE);
      await page.getByTestId('auth-load-error-retry').click();
      await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 20000 });
      expect(await getUserCoupleId(uid1)).toBe(coupleId);
    }
  );
});

test.describe('커플 카드 — 짝꿍 문서를 못 읽을 때', () => {
  test('짝꿍 users 문서가 어긋나 읽기가 거부돼도 카드가 스켈레톤에 멈추지 않는다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid2 } = twoUserAuthedContext;
    // 짝꿍 문서의 coupleId가 null로 어긋난 상태(덮어쓰기 사고) → 규칙상 내가 읽을 수 없다
    await seedUserDocument(uid2, EMAIL_2, null, { displayName: '현우' });

    await page.goto('/inner/cashbook');

    const card = page.getByTestId('couple-status-card');
    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(card).toContainText('짝꿍');
    await expect(page.getByTestId('couple-status-loading')).toHaveCount(0);
  });
});
