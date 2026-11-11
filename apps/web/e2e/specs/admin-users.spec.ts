import { expect, type Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { createTestUser, seedCashbookEntry, seedUserDocument } from '../helpers/emulator';

// .env.test 의 ADMIN_EMAILS 에 등록된 계정
const ADMIN_EMAIL = 'admin@test.com';
const PASSWORD = 'testpassword123';
const PHOTO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><rect width='8' height='8' fill='red'/></svg>";

async function signInAs(page: Page, email: string) {
  await page.evaluate(
    async ({ email, password }) => {
      const w = window as any;
      await w.__auth.signOut();
      await w.__signInWithEmailAndPassword(w.__auth, email, password);
    },
    { email, password: PASSWORD }
  );
  // 로그인 전환이 끝나기 전에 이동하면 미들웨어가 비로그인으로 보고 / 로 돌려보낸다.
  // 커플 없는 계정은 / 에서 온보딩으로 가므로, 온보딩 도착을 전환 완료 신호로 쓴다.
  await page.goto('/');
  await page.waitForURL('**/onboarding', { timeout: 15000 });
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
    // 앱에서 바꾼 이름·사진(users 문서)이 Auth 값보다 우선한다
    await seedUserDocument(uid, 'user1@test.com', coupleId, {
      displayName: '민지',
      photoURL: PHOTO,
    });

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
    await expect(row).toContainText('민지');
    await expect(row.getByTestId('admin-user-avatar').locator('img')).toHaveAttribute('src', PHOTO);

    await expect(page.getByTestId('admin-summary-total')).toContainText('3');

    // 기록 많은 순 정렬 → 기록 2건인 user1 이 맨 위
    await page.getByTestId('admin-sort-myEntryCount').click();
    await expect(page.getByTestId('admin-user-email').first()).toHaveText('user1@test.com');

    // 이름 검색 → 일치하는 사용자만
    await page.getByTestId('admin-user-search').fill('민지');
    await expect(page.getByTestId('admin-user-row')).toHaveCount(1);
    await expect(page.getByTestId('admin-user-email')).toHaveText('user1@test.com');
    await expect(page.getByTestId('admin-user-count')).toHaveText('1명 / 전체 3명');

    // 이메일 검색은 커플 상대 이메일도 찾는다 → user2 본인 + user2 가 상대인 user1
    await page.getByTestId('admin-user-search').fill('user2');
    await expect(page.getByTestId('admin-user-row')).toHaveCount(2);

    await page.getByTestId('admin-user-search').fill('없는사람');
    await expect(page.getByTestId('admin-user-row')).toHaveCount(0);
  });
});
