import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedDefaultCategories,
  seedCashbookEntry,
  seedAnnualPlan,
  seedAnnualPlanItem,
} from '../helpers/emulator';
import { CashbookMonthlyPage } from '../page-objects/CashbookMonthlyPage';

test.describe('월간 대시보드', () => {
  test.describe('현황 카드', () => {
    test('수입/지출 프로그레스 바와 잔액이 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      // 수입 예산: 월 350만
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-income-salary',
        group: 'income',
        subGroup: 'regular_income',
        monthlyAmounts: Array(12).fill(3500000),
        inputMode: 'regular',
      });
      // 지출 예산: 월 300만
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense-food',
        group: 'expense',
        subGroup: 'variable_common',
        monthlyAmounts: Array(12).fill(3000000),
      });

      await seedCashbookEntry(coupleId, uid, {
        type: 'income',
        amount: 3500000,
        category: '정기급여',
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 1860000,
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      await expect(monthly.overviewCard).toBeVisible();
      await expect(monthly.overviewCard.getByText('3,500,000원')).toBeVisible();
      await expect(monthly.overviewCard.getByText('1,860,000원')).toBeVisible();
      await expect(monthly.overviewCard.getByText('1,640,000원')).toBeVisible();
    });

    test('여유분이 20% 이상이면 안정(초록) 상태가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense',
        group: 'expense',
        subGroup: 'variable_common',
        monthlyAmounts: Array(12).fill(3000000),
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 1000000,
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      const status = monthly.statusBadge();
      await expect(status).toContainText('안정');
    });

    test('여유분이 0~20% 사이면 경고(노랑) 상태가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense',
        group: 'expense',
        subGroup: 'variable_common',
        monthlyAmounts: Array(12).fill(3000000),
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 2700000,
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      const status = monthly.statusBadge();
      await expect(status).toContainText('경고');
    });

    test('여유분이 0 이하면 긴급(빨강) 상태가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense',
        group: 'expense',
        subGroup: 'variable_common',
        monthlyAmounts: Array(12).fill(3000000),
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 3500000,
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      const status = monthly.statusBadge();
      await expect(status).toContainText('긴급');
    });
  });

  test.describe('지출 탭', () => {
    test('카테고리별 예산 대비 프로그레스 바가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense-food',
        group: 'expense',
        subGroup: 'variable_common',
        monthlyAmounts: Array(12).fill(600000),
      });

      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 390000,
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      await expect(monthly.expenseTab).toBeVisible();
      await expect(page.getByText('카테고리별 지출')).toBeVisible();
    });

    test('주별 지출 추이 테이블이 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense-food',
        group: 'expense',
        subGroup: 'variable_common',
        monthlyAmounts: Array(12).fill(600000),
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      await expect(page.getByText('주별 지출 추이')).toBeVisible();
      await expect(monthly.weeklyTable()).toBeVisible();
      await expect(monthly.weeklyTable().getByText('1주차')).toBeVisible();
    });
  });

  test.describe('수입 탭', () => {
    test('정기 수입 반영 상태가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-income-salary',
        group: 'income',
        subGroup: 'regular_income',
        monthlyAmounts: Array(12).fill(3500000),
        inputMode: 'regular',
      });

      await seedCashbookEntry(coupleId, uid, {
        type: 'income',
        amount: 3500000,
        category: '정기급여',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      await monthly.incomeTab.click();

      const incomeSection = monthly.incomeSection();
      await expect(incomeSection).toBeVisible();
      await expect(incomeSection.getByText('정기 수입')).toBeVisible();
    });

    test('비정기 수입을 추가할 수 있다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      await seedAnnualPlan(coupleId, year, uid);

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      await monthly.incomeTab.click();

      const addButton = page.getByRole('button', { name: /비정기 수입 추가/ });
      await expect(addButton).toBeVisible();

      await addButton.click();

      const sheet = page.getByRole('dialog');
      await expect(sheet).toBeVisible();

      await sheet.getByLabel('금액').fill('250000');
      await sheet.getByRole('button', { name: '부업' }).click();
      await sheet.getByRole('button', { name: '저장' }).click();

      await expect(sheet).not.toBeVisible({ timeout: 5000 });
      await expect(page.getByText('250,000원')).toBeVisible();
    });
  });

  test.describe('월 이동', () => {
    test('월 이동 시 해당 월 데이터로 갱신된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 100000,
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      await expect(monthly.overviewCard.getByText('100,000원')).toBeVisible();

      await monthly.prevMonthButton.click();

      await expect(monthly.overviewCard.getByText('0원')).toBeVisible();
    });
  });
});
