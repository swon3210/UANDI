import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedAnnualPlan,
  seedAnnualPlanItem,
  seedCashbookCategory,
  seedCashbookEntry,
  seedNotificationSettings,
} from '../helpers/emulator';
import { BudgetAlertPage } from '../page-objects/BudgetAlertPage';

/**
 * 식비 카테고리 + 월 60만원 예산 시드.
 * 식비 카테고리는 이름 매칭(`entry.category === category.name`)을 사용하므로
 * annualPlanItem의 categoryId가 실제 카테고리 ID와 같아야 카테고리별 알림이 동작한다.
 */
async function seedFoodBudget(
  coupleId: string,
  uid: string,
  options: { annualAmount?: number } = {}
): Promise<{ planId: string; foodCategoryId: string }> {
  const annualAmount = options.annualAmount ?? 7_200_000; // 월 60만

  const foodCategoryId = await seedCashbookCategory(coupleId, {
    group: 'expense',
    subGroup: 'variable_common',
    name: '식비',
    icon: 'bowl_food',
    sortOrder: 0,
  });

  const year = new Date().getFullYear();
  const planId = await seedAnnualPlan(coupleId, year, uid);

  await seedAnnualPlanItem(coupleId, planId, {
    categoryId: foodCategoryId,
    group: 'expense',
    subGroup: 'variable_common',
    monthlyAmounts: Array(12).fill(Math.round(annualAmount / 12)),
  });

  return { planId, foodCategoryId };
}

test.describe('가계부 예산 초과 알림', () => {
  test.describe('메인/주간 배너', () => {
    test('카테고리 예산을 100% 초과하면 메인 배너에 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 650_000, // 108%
        category: '식비',
      });

      const alert = new BudgetAlertPage(page);
      await alert.gotoMain();

      await expect(alert.banner()).toBeVisible();
      await expect(alert.banner()).toContainText('넘었어요');
    });

    test('120% 이상 초과하면 위험 단계로 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 800_000, // 133%
        category: '식비',
      });

      const alert = new BudgetAlertPage(page);
      await alert.gotoMain();

      await expect(alert.banner()).toBeVisible();
      await expect(alert.banner()).toContainText('20% 이상 초과');
    });

    test('예산의 80%만 넘으면(임박) 배너에 표시되지 않는다', async ({ authedContext }) => {
      // 80% 임박은 상시 배너에서 제외됐다. (월간 노란 게이지 + 실시간 토스트가 담당)
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 480_000, // 80%
        category: '식비',
      });

      const alert = new BudgetAlertPage(page);
      await alert.gotoMain();

      await expect(alert.banner()).not.toBeVisible();
    });

    test('예산 80% 미만에서는 배너가 표시되지 않는다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 300_000, // 50%
        category: '식비',
      });

      const alert = new BudgetAlertPage(page);
      await alert.gotoMain();

      await expect(alert.banner()).not.toBeVisible();
    });

    test('전체 예산은 여유 있어도 특정 카테고리가 초과하면 배너에 표시된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      // 식비 월 60만 + 여가 월 100만 = 월 전체 160만 예산
      const { planId } = await seedFoodBudget(coupleId, uid);
      const leisureCategoryId = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_personal',
        name: '여가',
        icon: 'movie',
        sortOrder: 1,
      });
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: leisureCategoryId,
        group: 'expense',
        subGroup: 'variable_personal',
        monthlyAmounts: Array(12).fill(1_000_000), // 월 100만
      });

      // 식비 65만(108% 초과) + 여가 10만(10%) → 전체 75만/160만 = 47% 안정
      await seedCashbookEntry(coupleId, uid, { type: 'expense', amount: 650_000, category: '식비' });
      await seedCashbookEntry(coupleId, uid, { type: 'expense', amount: 100_000, category: '여가' });

      const alert = new BudgetAlertPage(page);
      await alert.gotoMain();

      await expect(alert.banner()).toBeVisible();
      await expect(alert.banner()).toContainText('카테고리');
      // 전체 지출은 초과가 아니므로 "넘었어요"(전체 라인)는 없어야 한다
      await expect(alert.banner()).not.toContainText('전체 지출');
    });

    test('주간 페이지에도 배너가 노출된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 650_000,
        category: '식비',
      });

      const alert = new BudgetAlertPage(page);
      await alert.gotoWeekly();

      await expect(alert.banner()).toBeVisible();
    });
  });

  test.describe('전체 닫기', () => {
    test('전체 닫기 버튼을 누르면 배너가 사라진다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 650_000, // over100
        category: '식비',
      });

      const alert = new BudgetAlertPage(page);
      await alert.gotoMain();

      await expect(alert.banner()).toBeVisible();
      await alert.dismissAll().click();
      await expect(alert.banner()).not.toBeVisible();
    });

    test('닫은 뒤에도 다음 임계값(over120)에 진입하면 다시 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 650_000, // over100
        category: '식비',
      });

      const alert = new BudgetAlertPage(page);
      await alert.gotoMain();

      await alert.dismissAll().click();
      await expect(alert.banner()).not.toBeVisible();

      // 추가 거래로 over120 도달 (누적 850,000 = 141%) → 새 임계값 키라 다시 표시
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 200_000,
        category: '식비',
      });
      await page.reload();

      await expect(alert.banner()).toBeVisible();
      await expect(alert.banner()).toContainText('20% 이상 초과');
    });
  });

  test.describe('월간으로 드릴다운', () => {
    test('자세히 보기 링크를 누르면 월간 페이지로 이동한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 650_000,
        category: '식비',
      });

      const alert = new BudgetAlertPage(page);
      await alert.gotoMain();

      await expect(alert.detailLink()).toBeVisible();
      await alert.detailLink().click();

      await expect(page).toHaveURL(/\/inner\/cashbook\/history\/monthly/);
      await expect(page.getByTestId('monthly-overview')).toBeVisible();
    });

    test('월간 페이지에서는 배너가 표시되지 않는다 (상세가 페이지에 있으므로)', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 650_000,
        category: '식비',
      });

      const alert = new BudgetAlertPage(page);
      await alert.gotoMonthly();

      await expect(alert.banner()).not.toBeVisible();
    });
  });

  test.describe('알림 설정 연동', () => {
    test('budgetWarning.enabled = false 이면 배너가 표시되지 않는다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedNotificationSettings(uid, { coupleId, budgetWarningEnabled: false });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 800_000, // over120
        category: '식비',
      });

      const alert = new BudgetAlertPage(page);
      await alert.gotoMain();

      await expect(alert.banner()).not.toBeVisible();
    });
  });
});
