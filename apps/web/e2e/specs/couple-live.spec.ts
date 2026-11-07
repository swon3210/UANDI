import { expect } from '@playwright/test';
import dayjs from 'dayjs';
import { test } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects/DashboardPage';
import {
  listNudges,
  seedCashbookEntry,
  seedDefaultCategories,
  seedNudge,
  seedUserDocument,
} from '../helpers/emulator';

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';

/**
 * 짝꿍 화면 — 2026-11 걷기 6구간 반영
 * - 짝꿍이 적은 내역이 같은 화면에 머물러도 바로 들어온다(최신 내역 1건 실시간 구독 → 쿼리 무효화)
 * - 받은 콕 찌르기가 대시보드 카드로 보인다(푸시 없이도)
 * - 최근 내역 카드에 작성자 아바타
 *
 * 짝꿍의 행동은 에뮬레이터 REST로 심는다(Firestore 리스너는 REST 쓰기에도 반응한다).
 */
test.describe('짝꿍 화면 실시간', () => {
  test('짝꿍이 내역을 적으면 대시보드가 그 자리에서 갱신되고 토스트가 뜬다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '진성' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '세진' });
    await seedDefaultCategories(coupleId);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.emptyState).toBeVisible();

    // 짝꿍(세진)이 다른 기기에서 수입을 적는다
    await seedCashbookEntry(coupleId, uid2, {
      type: 'income',
      amount: 3000000,
      category: '정기급여',
      description: '11월 월급',
      date: dayjs().toISOString(),
    });

    await expect(page.getByText('세진님이 내역을 적었어요')).toBeVisible({ timeout: 10000 });
    // 화면을 떠나지 않아도 최근 내역 카드와 게이지가 바뀐다
    await expect(dashboard.recentEntries).toBeVisible({ timeout: 10000 });
    await expect(dashboard.recentEntries).toContainText('11월 월급');
    await expect(dashboard.emptyState).toHaveCount(0);
  });

  test('내역 화면에 머물러도 짝꿍이 적은 내역이 바로 보인다', async ({ twoUserAuthedContext }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '진성' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '세진' });
    await seedDefaultCategories(coupleId);

    await page.goto('/inner/cashbook/history');
    await expect(page.getByText('아직 내역이 없어요')).toBeVisible();

    await seedCashbookEntry(coupleId, uid2, {
      type: 'expense',
      amount: 4500,
      category: '식비',
      description: '짝꿍 커피',
      date: dayjs().toISOString(),
    });

    await expect(page.getByText('짝꿍 커피')).toBeVisible({ timeout: 10000 });
    // 내역 화면에서는 토스트에 "내역 보기" 액션이 없다
    await expect(page.getByText('세진님이 내역을 적었어요')).toBeVisible();
    await expect(page.getByRole('button', { name: '내역 보기' })).toHaveCount(0);
  });

  test('최근 내역 카드에 작성자 아바타가 붙는다', async ({ twoUserAuthedContext }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '진성' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '세진' });
    await seedDefaultCategories(coupleId);
    const monthStart = dayjs().startOf('month');
    await seedCashbookEntry(coupleId, uid1, {
      type: 'expense',
      amount: 9000,
      category: '식비',
      description: '김치찌개',
      date: monthStart.add(2, 'hour').toISOString(),
    });
    await seedCashbookEntry(coupleId, uid2, {
      type: 'income',
      amount: 3000000,
      category: '정기급여',
      description: '11월 월급',
      date: monthStart.add(1, 'hour').toISOString(),
    });

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.recentEntries).toBeVisible();

    const avatars = dashboard.recentEntries.locator('[data-testid="entry-author-avatar"]');
    await expect(avatars).toHaveCount(2);
    await expect(avatars.nth(0)).toHaveAttribute('title', '진성');
    await expect(avatars.nth(1)).toHaveAttribute('title', '세진');
  });
});

test.describe('받은 콕 찌르기 카드', () => {
  test('받은 요청이 카드로 보이고 내역 적기로 빠른 추가 시트가 열린다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '진성' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '세진' });
    await seedNudge(coupleId, uid2, uid1, { status: 'pending', message: '카드값 기록 부탁해' });

    await page.goto('/inner/cashbook');

    const card = page.getByTestId('nudge-received');
    await expect(card).toBeVisible();
    await expect(card).toContainText('세진님이 콕 찔렀어요');
    await expect(card).toContainText('카드값 기록 부탁해');

    await page.getByTestId('nudge-received-add').click();
    await expect(page.getByTestId('quick-add-sheet')).toBeVisible();

    // 상태가 seen으로 바뀌고 카드는 사라진다
    await expect
      .poll(async () => (await listNudges(coupleId))[0]?.status, { timeout: 10000 })
      .toBe('seen');
    await expect(card).toHaveCount(0);
  });

  test('나중에를 누르면 카드가 사라지고 dismissed가 된다', async ({ twoUserAuthedContext }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '진성' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '세진' });
    await seedNudge(coupleId, uid2, uid1, { status: 'pending', message: '' });

    await page.goto('/inner/cashbook');

    const card = page.getByTestId('nudge-received');
    await expect(card).toBeVisible();
    // 빈 문구면 기본 안내
    await expect(card).toContainText('가계부 입력을 부탁했어요');

    await page.getByTestId('nudge-received-dismiss').click();
    await expect(card).toHaveCount(0);
    await expect
      .poll(async () => (await listNudges(coupleId))[0]?.status, { timeout: 10000 })
      .toBe('dismissed');
  });

  test('짝꿍이 보내는 순간 카드가 새로고침 없이 나타난다', async ({ twoUserAuthedContext }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '진성' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '세진' });

    await page.goto('/inner/cashbook');
    await expect(page.getByTestId('couple-status-card')).toBeVisible();
    await expect(page.getByTestId('nudge-received')).toHaveCount(0);

    await seedNudge(coupleId, uid2, uid1, { status: 'pending', message: '오늘 쓴 거 입력해줘' });

    const card = page.getByTestId('nudge-received');
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card).toContainText('오늘 쓴 거 입력해줘');
  });

  test('내가 보낸 요청은 내 카드에 보이지 않는다', async ({ twoUserAuthedContext }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '진성' });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '세진' });
    await seedNudge(coupleId, uid1, uid2, { status: 'pending', message: '오늘 쓴 거 입력해줘' });

    await page.goto('/inner/cashbook');
    await expect(page.getByTestId('couple-status-card')).toBeVisible();
    await expect(page.getByTestId('nudge-received')).toHaveCount(0);
  });
});
