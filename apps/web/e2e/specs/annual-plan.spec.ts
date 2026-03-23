import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { AnnualPlanPage } from '../page-objects/AnnualPlanPage';
import { seedDefaultCategories, seedAnnualPlan, seedAnnualPlanItem } from '../helpers/emulator';

test.describe('연간 예산 계획', () => {
  test.describe('연간 요약', () => {
    test('연간 계획 페이지에 진입하면 연간 요약 카드가 표시된다', async ({ authedContext }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();

      await expect(annualPage.summaryCard).toBeVisible();
      await expect(annualPage.summaryRow('수입')).toBeVisible();
      await expect(annualPage.summaryRow('지출')).toBeVisible();
      await expect(annualPage.summaryRow('재테크')).toBeVisible();
      await expect(annualPage.summaryRow('Flex')).toBeVisible();
    });
  });

  test.describe('수입 계획', () => {
    test('수입 탭에서 정기 수입 금액을 입력하면 연간 합계가 갱신된다', async ({
      authedContext,
    }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.incomeTab.click();

      // 정기급여 항목에 금액 입력
      const amountInput = annualPage.planItemAmountInput('정기급여');
      await amountInput.fill('3500000');

      // 연간 합계 갱신 대기
      await expect(annualPage.totalAmount('income')).toContainText('42,000,000');
    });

    test('비정기 수입 금액을 입력하면 총 수입이 갱신된다', async ({ authedContext }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);
      const planId = await seedAnnualPlan(coupleId, new Date().getFullYear(), uid);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.incomeTab.click();

      const amountInput = annualPage.planItemAmountInput('인센티브');
      await amountInput.fill('5000000');

      await expect(annualPage.totalAmount('income')).toContainText('5,000,000');
    });
  });

  test.describe('지출 계획', () => {
    test('지출 탭에서 고정 지출 금액을 입력하면 연간 합계가 갱신된다', async ({
      authedContext,
    }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.expenseTab.click();

      const amountInput = annualPage.planItemAmountInput('월세');
      await amountInput.fill('800000');

      // 월세 800,000/월 × 12 = 9,600,000
      await expect(annualPage.totalAmount('expense')).toContainText('9,600,000');
    });

    test('고정 지출의 연간 금액 입력 시 월세를 월별 금액으로 표시한다', async ({
      authedContext,
    }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.expenseTab.click();

      const amountInput = annualPage.planItemAmountInput('보험');
      await amountInput.fill('200000');

      // 보험 200,000/월 × 12 = 2,400,000
      await expect(annualPage.totalAmount('expense')).toContainText('2,400,000');
    });
  });

  test.describe('재테크 계획', () => {
    test('재테크 탭에서 가용 금액이 수입-지출로 자동 계산된다', async ({ authedContext }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      // 수입 항목 시드
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-income-1',
        group: 'income',
        subGroup: 'regular_income',
        annualAmount: 54000000,
        monthlyAmount: 4500000,
      });
      // 지출 항목 시드
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense-1',
        group: 'expense',
        subGroup: 'fixed_expense',
        annualAmount: 36000000,
        monthlyAmount: 3000000,
      });

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.investmentTab.click();

      // 가용 금액 = 54,000,000 - 36,000,000 = 18,000,000
      await expect(annualPage.availableAmountDisplay).toContainText('18,000,000');
    });

    test('목표 수익률을 입력하면 목표 금액이 계산된다', async ({ authedContext }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-income-1',
        group: 'income',
        subGroup: 'regular_income',
        annualAmount: 18000000,
      });

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.investmentTab.click();

      await annualPage.targetReturnRateInput.fill('3');

      // 18,000,000 × 1.03 = 18,540,000
      await expect(annualPage.targetAmountDisplay).toContainText('18,540,000');
    });

    test('배분 합계가 가용 금액을 초과하면 경고가 표시된다', async ({ authedContext }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      // 수입 10,000,000만
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-income-1',
        group: 'income',
        subGroup: 'regular_income',
        annualAmount: 10000000,
      });

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.investmentTab.click();

      // 재테크 배분에 가용 금액(10,000,000)보다 큰 금액 입력
      const amountInput = annualPage.planItemAmountInput('예적금');
      await amountInput.fill('15000000');

      await expect(annualPage.overBudgetWarning).toBeVisible();
    });
  });

  test.describe('Flex 계획', () => {
    test('Flex 탭에서 미배분 잔액이 표시된다', async ({ authedContext }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-income-1',
        group: 'income',
        subGroup: 'regular_income',
        annualAmount: 20000000,
      });
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense-1',
        group: 'expense',
        subGroup: 'fixed_expense',
        annualAmount: 10000000,
      });
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-invest-1',
        group: 'investment',
        subGroup: 'cash_holding',
        annualAmount: 6000000,
      });

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.flexTab.click();

      // 가용 = 20M - 10M = 10M, 재테크 = 6M, Flex 미배분 = 4M
      await expect(annualPage.flexAvailableDisplay).toContainText('4,000,000');
    });

    test('Flex 배분 합계와 미배분이 정확히 계산된다', async ({ authedContext }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-income-1',
        group: 'income',
        subGroup: 'regular_income',
        annualAmount: 20000000,
      });

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.flexTab.click();

      const amountInput = annualPage.planItemAmountInput('여행');
      await amountInput.fill('2000000');

      await expect(annualPage.flexTotalDisplay).toContainText('2,000,000');
    });
  });
});
