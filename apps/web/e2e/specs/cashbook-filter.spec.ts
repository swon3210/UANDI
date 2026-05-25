import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories, seedCashbookEntry } from '../helpers/emulator';
import { CashbookPage } from '../page-objects/CashbookPage';

test.describe('가계부 내역 필터', () => {
  test('지출 탭으로 전환하면 수입 항목이 사라진다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const incomeId = await seedCashbookEntry(coupleId, uid, {
      type: 'income',
      amount: 3000000,
      category: '정기급여',
    });
    const expenseId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await expect(page.getByTestId(`entry-card-${incomeId}`)).toBeVisible();
    await expect(page.getByTestId(`entry-card-${expenseId}`)).toBeVisible();

    await page.getByTestId('filter-type-expense').click();

    await expect(page.getByTestId(`entry-card-${expenseId}`)).toBeVisible();
    await expect(page.getByTestId(`entry-card-${incomeId}`)).not.toBeVisible();
  });

  test('카테고리 칩 선택 시 다른 카테고리 항목은 숨겨진다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const sikbiId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });
    const trafficId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '교통',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await page.getByTestId('filter-type-expense').click();
    await page.getByTestId('filter-category-chip-식비').click();

    await expect(page.getByTestId(`entry-card-${sikbiId}`)).toBeVisible();
    await expect(page.getByTestId(`entry-card-${trafficId}`)).not.toBeVisible();
  });

  test('카테고리 2개 선택 시 둘 다 포함된다(OR 조건)', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const sikbiId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });
    const trafficId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '교통',
    });
    const monthlyRentId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 700000,
      category: '월세',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await page.getByTestId('filter-type-expense').click();
    await page.getByTestId('filter-category-chip-식비').click();
    await page.getByTestId('filter-category-chip-교통').click();

    await expect(page.getByTestId(`entry-card-${sikbiId}`)).toBeVisible();
    await expect(page.getByTestId(`entry-card-${trafficId}`)).toBeVisible();
    await expect(page.getByTestId(`entry-card-${monthlyRentId}`)).not.toBeVisible();
  });

  test('초기화 버튼 클릭 시 카테고리 선택이 해제된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const sikbiId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });
    const trafficId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '교통',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await page.getByTestId('filter-type-expense').click();
    await page.getByTestId('filter-category-chip-식비').click();

    await expect(page.getByTestId(`entry-card-${trafficId}`)).not.toBeVisible();

    await page.getByTestId('filter-reset').click();

    await expect(page.getByTestId(`entry-card-${sikbiId}`)).toBeVisible();
    await expect(page.getByTestId(`entry-card-${trafficId}`)).toBeVisible();
  });

  test('월 이동 시 카테고리 선택은 초기화되되 타입 탭은 유지된다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);

    const sikbiThisMonthId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });
    const trafficLastMonthId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '교통',
      date: lastMonth.toISOString(),
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await page.getByTestId('filter-type-expense').click();
    await page.getByTestId('filter-category-chip-식비').click();
    await expect(page.getByTestId(`entry-card-${sikbiThisMonthId}`)).toBeVisible();

    await cashbook.prevMonthButton.click();

    await expect(page.getByTestId(`entry-card-${trafficLastMonthId}`)).toBeVisible();

    const expenseTab = page.getByTestId('filter-type-expense');
    await expect(expenseTab).toHaveAttribute('aria-selected', 'true');
  });

  test('필터 결과가 0건이면 전용 빈 상태가 표시된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await page.getByTestId('filter-type-income').click();

    await expect(page.getByText('조건에 맞는 내역이 없어요')).toBeVisible();
  });

  test('필터 활성 시 월별 요약 카드에 필터 결과 보조 라인이 표시된다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '교통',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await expect(page.getByTestId('filter-result-summary')).toBeHidden();

    await page.getByTestId('filter-type-expense').click();
    await page.getByTestId('filter-category-chip-식비').click();

    const filterSummary = page.getByTestId('filter-result-summary');
    await expect(filterSummary).toBeVisible();
    await expect(filterSummary).toContainText('45,000');
  });
});
