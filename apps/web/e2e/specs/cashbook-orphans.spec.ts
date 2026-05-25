import { expect } from '@playwright/test';
import dayjs from 'dayjs';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories, seedCashbookEntry } from '../helpers/emulator';
import { CashbookOrphansPage } from '../page-objects/CashbookOrphansPage';
import { CashbookPage } from '../page-objects/CashbookPage';

test.describe('미분류 내역 정리', () => {
  test('카테고리 페이지에서 진입하면 깨진 이름별 그룹 카드가 노출된다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 10000,
      category: '옛카테고리A',
      description: '첫번째',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 20000,
      category: '옛카테고리A',
      description: '두번째',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 5000,
      category: '옛카테고리B',
    });
    // 정상 카테고리 — orphan 페이지에 노출되면 안 됨
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 7000,
      category: '식비',
    });

    const orphans = new CashbookOrphansPage(page);
    await orphans.goto();

    await expect(orphans.headerTotalCount).toContainText('3건');

    await expect(orphans.groupCard('옛카테고리A')).toBeVisible();
    await expect(orphans.groupCard('옛카테고리A')).toContainText('2건');
    await expect(orphans.groupCard('옛카테고리B')).toBeVisible();
    await expect(orphans.groupCard('옛카테고리B')).toContainText('1건');

    await expect(orphans.groupCard('식비')).not.toBeVisible();
  });

  test('그룹 전체를 새 카테고리로 일괄 재매칭한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 10000,
      category: '옛카테고리A',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 20000,
      category: '옛카테고리A',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 5000,
      category: '옛카테고리B',
    });

    const orphans = new CashbookOrphansPage(page);
    await orphans.goto();

    await expect(orphans.groupCard('옛카테고리A')).toBeVisible();
    await orphans.groupRemapButton('옛카테고리A').click();

    await orphans.sheet.waitFor({ state: 'visible' });
    await orphans.sheetCategoryChip('식비').click();
    await orphans.sheetConfirmButton.click();

    await expect(orphans.groupCard('옛카테고리A')).not.toBeVisible();
    await expect(orphans.groupCard('옛카테고리B')).toBeVisible();

    const cashbook = new CashbookPage(page);
    await cashbook.goto();
    const entryCards = page.locator('[data-testid^="entry-card-"]');
    await expect(entryCards.filter({ hasText: '식비' })).toHaveCount(2);
    await expect(entryCards.filter({ hasText: '옛카테고리B' })).toHaveCount(1);
  });

  test('그룹 안에서 일부만 선택해 부분 재매칭한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    const id1 = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 10000,
      category: '옛카테고리C',
      description: '아이템1',
    });
    const id2 = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 20000,
      category: '옛카테고리C',
      description: '아이템2',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 30000,
      category: '옛카테고리C',
      description: '아이템3',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 40000,
      category: '옛카테고리C',
      description: '아이템4',
    });

    const orphans = new CashbookOrphansPage(page);
    await orphans.goto();

    await expect(orphans.groupCard('옛카테고리C')).toContainText('4건');

    await orphans.groupEntryRow('옛카테고리C', id1).click();
    await orphans.groupEntryRow('옛카테고리C', id2).click();

    await orphans.groupRemapButton('옛카테고리C').click();
    await orphans.sheet.waitFor({ state: 'visible' });
    await expect(orphans.sheet.getByText(/선택된 2건/)).toBeVisible();

    await orphans.sheetCategoryChip('교통').click();
    await orphans.sheetConfirmButton.click();

    await expect(orphans.groupCard('옛카테고리C')).toContainText('2건');
  });

  test('"더 이전 달도 보기"로 기본 기간 밖의 내역까지 확장한다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    const oldDate = dayjs().subtract(5, 'month').date(10).toISOString();
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 9999,
      category: '오래된옛카테고리',
      date: oldDate,
    });

    const orphans = new CashbookOrphansPage(page);
    await orphans.goto();

    await expect(orphans.headerTotalCount).toContainText('0건');
    await expect(orphans.groupCard('오래된옛카테고리')).not.toBeVisible();

    for (let i = 0; i < 4; i++) {
      await orphans.loadMoreButton.click();
    }

    await expect(orphans.groupCard('오래된옛카테고리')).toBeVisible();
  });

  test('카테고리 설정 페이지의 "미분류 정리" 버튼으로 진입할 수 있다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 1000,
      category: '깨진이름',
    });

    await page.goto('/cashbook/categories');
    await page.getByTestId('categories-orphans-link').click();

    await expect(page).toHaveURL(/\/cashbook\/categories\/orphans/);
    const orphans = new CashbookOrphansPage(page);
    await expect(orphans.groupCard('깨진이름')).toBeVisible();
  });
});
