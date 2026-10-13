import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { AnnualPlanPage } from '../page-objects/AnnualPlanPage';
import { seedCashbookCategory, seedAnnualPlan, seedAnnualPlanItem } from '../helpers/emulator';

// 위저드/일괄수정/보고서 관련 신규 spec 은 별도 파일에서 다룬다.
// 본 파일은 메인(목표) 페이지의 hero + 카테고리 카드 표시만 검증한다.
// 계획이 없으면 메인은 위저드로 리디렉트하므로, 수입·지출 항목이 있는 계획을 먼저 시드한다.

test.describe('연간 경제 목표', () => {
  test.describe('목표 메인', () => {
    test('메인 진입 시 hero 카드와 2개 카테고리 카드(수입/지출)가 표시된다', async ({
      authedContext,
    }) => {
      const { page, coupleId, uid } = authedContext;
      const planId = await seedAnnualPlan(coupleId, new Date().getFullYear(), uid);
      const catIncome = await seedCashbookCategory(coupleId, {
        group: 'income',
        subGroup: 'regular_income',
        name: '정기급여',
        icon: 'wallet',
        sortOrder: 0,
      });
      const catExpense = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'fixed_expense',
        name: '월세',
        icon: 'house',
        sortOrder: 0,
      });
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: catIncome,
        group: 'income',
        subGroup: 'regular_income',
        monthlyAmounts: Array(12).fill(3_000_000),
        inputMode: 'regular',
        baseMonthlyAmount: 3_000_000,
      });
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: catExpense,
        group: 'expense',
        subGroup: 'fixed_expense',
        monthlyAmounts: Array(12).fill(800_000),
        inputMode: 'regular',
        baseMonthlyAmount: 800_000,
      });

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();

      await expect(annualPage.heroCard).toBeVisible();
      await expect(annualPage.goalCard('income')).toBeVisible();
      await expect(annualPage.goalCard('expense')).toBeVisible();
    });
  });
});
