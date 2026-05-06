import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { AnnualPlanPage } from '../page-objects/AnnualPlanPage';
import {
  seedDefaultCategories,
  seedAnnualPlan,
  seedAnnualPlanItem,
} from '../helpers/emulator';

test.describe('연간 경제 목표', () => {
  test.describe('목표 메인', () => {
    test('메인 진입 시 hero 카드와 4개 카테고리 카드가 표시된다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();

      await expect(annualPage.heroCard).toBeVisible();
      await expect(annualPage.goalCard('income')).toBeVisible();
      await expect(annualPage.goalCard('expense')).toBeVisible();
      await expect(annualPage.goalCard('investment')).toBeVisible();
      await expect(annualPage.goalCard('flex')).toBeVisible();
    });

    test('카테고리 카드 클릭 시 해당 상세 뷰로 진입한다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.drillIntoCategory('income');

      await expect(annualPage.detailView).toBeVisible();
      await expect(annualPage.goalDetailHeader('income')).toBeVisible();
      await expect(annualPage.backButton).toBeVisible();
      await expect(page).toHaveURL(/category=income/);
    });

    test('상세 뷰에서 뒤로가기 시 메인으로 복귀한다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.gotoCategory('expense');
      await expect(annualPage.detailView).toBeVisible();

      await annualPage.backButton.click();

      await expect(annualPage.heroCard).toBeVisible();
      await expect(annualPage.detailView).toBeHidden();
    });

    test('?category= 쿼리로 직접 진입할 수 있다 (deeplink)', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.gotoCategory('flex');

      await expect(annualPage.detailView).toBeVisible();
      await expect(annualPage.goalDetailHeader('flex')).toBeVisible();
    });
  });

  test.describe('수입 계획', () => {
    test('수입 카드에서 정기 수입을 입력하면 연간 합계가 갱신된다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.drillIntoCategory('income');

      const amountInput = annualPage.planItemAmountInput('정기급여');
      await amountInput.fill('3500000');

      // 정기급여 3,500,000/월 × 12 = 42,000,000
      await expect(annualPage.totalAmount('income')).toContainText('42,000,000');
    });
  });

  test.describe('지출 계획', () => {
    test('지출 카드에서 고정 지출을 입력하면 연간 합계가 갱신된다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();
      await annualPage.drillIntoCategory('expense');

      const amountInput = annualPage.planItemAmountInput('월세');
      await amountInput.fill('800000');

      // 월세 800,000/월 × 12 = 9,600,000
      await expect(annualPage.totalAmount('expense')).toContainText('9,600,000');
    });
  });

  test.describe('재테크 계획', () => {
    test('재테크 카드 진입 시 가용 금액이 수입-지출로 자동 계산된다', async ({
      authedContext,
    }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-income-1',
        group: 'income',
        subGroup: 'regular_income',
        annualAmount: 54000000,
        monthlyAmount: 4500000,
      });
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense-1',
        group: 'expense',
        subGroup: 'fixed_expense',
        annualAmount: 36000000,
        monthlyAmount: 3000000,
      });

      const annualPage = new AnnualPlanPage(page);
      await annualPage.gotoCategory('investment');

      // 가용 금액 = 54,000,000 - 36,000,000 = 18,000,000
      await expect(annualPage.availableAmountDisplay).toContainText('18,000,000');
    });

    test('목표 수익률을 입력하면 목표 금액이 계산된다', async ({
      authedContext,
    }) => {
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
      await annualPage.gotoCategory('investment');

      await annualPage.targetReturnRateInput.fill('3');

      // 18,000,000 × 1.03 = 18,540,000
      await expect(annualPage.targetAmountDisplay).toContainText('18,540,000');
    });

    test('배분 합계가 가용 금액을 초과하면 경고가 표시된다', async ({
      authedContext,
    }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-income-1',
        group: 'income',
        subGroup: 'regular_income',
        annualAmount: 10000000,
      });

      const annualPage = new AnnualPlanPage(page);
      await annualPage.gotoCategory('investment');

      const amountInput = annualPage.planItemAmountInput('예적금');
      await amountInput.fill('15000000');

      await expect(annualPage.overBudgetWarning).toBeVisible();
    });
  });

  test.describe('Flex 계획', () => {
    test('Flex 카드 진입 시 미배분 잔액이 표시된다', async ({ authedContext }) => {
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
      await annualPage.gotoCategory('flex');

      // 가용 = 20M - 10M = 10M, 재테크 = 6M, Flex 미배분 = 4M
      await expect(annualPage.flexAvailableDisplay).toContainText('4,000,000');
    });
  });
});
