import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedDefaultCategories,
  seedCashbookEntry,
  seedUserDocument,
} from '../helpers/emulator';
import { CashbookPage } from '../page-objects/CashbookPage';

const EMAIL_1 = 'user1@test.com';
const EMAIL_2 = 'user2@test.com';

test.describe('가계부 작성자 표시', () => {
  test('내역 목록 카드에 각 내역 작성자 아바타가 표시된다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;

    // 두 멤버를 이니셜이 다르게 구분되도록 재시드 (사진 없음 → 이니셜 폴백)
    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수', photoURL: null });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우', photoURL: null });
    await seedDefaultCategories(coupleId);

    // 각 멤버가 하나씩 내역 작성
    await seedCashbookEntry(coupleId, uid1, {
      type: 'expense',
      amount: 12000,
      category: '식비',
      description: '내 점심',
    });
    await seedCashbookEntry(coupleId, uid2, {
      type: 'expense',
      amount: 30000,
      category: '식비',
      description: '상대 저녁',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    // 내역 카드 2개가 보이고, 각 카드에 작성자 아바타가 달려 있어야 한다
    const entryCards = page.locator('[data-testid^="entry-card-"]');
    await expect(entryCards).toHaveCount(2);

    const avatars = page.locator('[data-testid="entry-author-avatar"]');
    await expect(avatars).toHaveCount(2);

    // 사진이 없으므로 displayName 이니셜로 두 작성자가 구분되어야 한다
    await expect(
      page.locator('[data-testid="entry-author-avatar"][title="지수"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="entry-author-avatar"][title="현우"]')
    ).toBeVisible();
    await expect(avatars.filter({ hasText: '지' })).toBeVisible();
    await expect(avatars.filter({ hasText: '현' })).toBeVisible();
  });

  test('내역 편집 시트 헤더에 작성자 이름이 표시된다', async ({ twoUserAuthedContext }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;

    await seedUserDocument(uid1, EMAIL_1, coupleId, { displayName: '지수', photoURL: null });
    await seedUserDocument(uid2, EMAIL_2, coupleId, { displayName: '현우', photoURL: null });
    await seedDefaultCategories(coupleId);

    // 상대(현우)가 작성한 내역
    const partnerEntryId = await seedCashbookEntry(coupleId, uid2, {
      type: 'expense',
      amount: 30000,
      category: '식비',
      description: '상대 저녁',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    // 해당 내역을 탭하면 편집 시트가 열리고 작성자 이름이 보여야 한다
    await cashbook.entryCard(partnerEntryId).click();
    const sheet = page.getByTestId('entry-form-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText('현우')).toBeVisible();
  });
});
