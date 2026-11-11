import { expect, type Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { createTestUser, seedCashbookEntry, seedUserDocument } from '../helpers/emulator';

// .env.test 의 ADMIN_EMAILS 에 등록된 계정
const ADMIN_EMAIL = 'admin@test.com';
const PASSWORD = 'testpassword123';

async function signInAs(page: Page, email: string) {
  await page.evaluate(
    async ({ email, password }) => {
      const w = window as any;
      await w.__auth.signOut();
      await w.__signInWithEmailAndPassword(w.__auth, email, password);
    },
    { email, password: PASSWORD }
  );
  // AuthInit 이 로그인 쿠키를 다시 심기 전에 이동하면 미들웨어가 비로그인으로 보고 / 로 돌려보낸다
  await expect
    .poll(async () => (await page.context().cookies()).find((c) => c.name === 'uandi-auth')?.value)
    .toBe('no_couple');
}

test.describe('어드민 사용자 현황 (/admin)', () => {
  test('허용 목록에 없는 사용자는 접근 권한이 없다는 안내를 본다', async ({ authedPage }) => {
    await authedPage.goto('/admin');
    await expect(authedPage.getByTestId('admin-forbidden')).toBeVisible();
    await expect(authedPage.getByTestId('admin-user-row')).toHaveCount(0);
  });

  test('허용된 계정은 사용자별 이메일과 기록 건수를 본다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashbookEntry(coupleId, uid, { type: 'expense', amount: 12000 });
    await seedCashbookEntry(coupleId, uid, { type: 'expense', amount: 8000 });

    const adminUid = await createTestUser(ADMIN_EMAIL, PASSWORD);
    await seedUserDocument(adminUid, ADMIN_EMAIL, null);
    await signInAs(page, ADMIN_EMAIL);

    await page.goto('/admin');
    await expect(page.getByTestId('admin-users-page')).toBeVisible();

    const row = page.getByTestId('admin-user-row').filter({
      has: page.getByTestId('admin-user-email').getByText('user1@test.com', { exact: true }),
    });
    await expect(row).toBeVisible();
    await expect(row).toContainText('user2@test.com');
    await expect(row.getByTestId('admin-user-entries')).toHaveText('2 / 2');

    await expect(page.getByTestId('admin-summary-total')).toContainText('3');
  });
});
