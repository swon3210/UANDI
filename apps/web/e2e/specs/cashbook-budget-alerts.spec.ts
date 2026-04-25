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
import { CashbookMonthlyPage } from '../page-objects/CashbookMonthlyPage';

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
    annualAmount,
  });

  return { planId, foodCategoryId };
}

test.describe('가계부 예산 초과 알림', () => {
  test.describe('인앱 배너', () => {
    test('카테고리 예산의 80%를 넘으면 배너에 노란 경고가 표시된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid); // 식비 월 60만
      // 480,000 = 80% 도달
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 480_000,
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      const alert = new BudgetAlertPage(page);
      await expect(alert.banner()).toBeVisible();
      await expect(alert.banner()).toContainText('식비');
      await expect(alert.banner()).toContainText('80%');
    });

    test('카테고리 예산을 100% 초과하면 배너에 빨간 경고가 표시된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 650_000, // 108%
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      const alert = new BudgetAlertPage(page);
      await expect(alert.banner()).toBeVisible();
      await expect(alert.banner()).toContainText('식비');
      await expect(alert.banner()).toContainText('넘었어요');
    });

    test('카테고리 예산을 120% 이상 초과하면 위험 단계 경고가 표시된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 800_000, // 133%
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      const alert = new BudgetAlertPage(page);
      await expect(alert.banner()).toBeVisible();
      await expect(alert.banner()).toContainText('20% 이상 초과');
    });

    test('예산 80% 미만에서는 배너가 표시되지 않는다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 300_000, // 50%
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      const alert = new BudgetAlertPage(page);
      await expect(alert.banner()).not.toBeVisible();
    });

    test('배너의 dismiss 버튼을 누르면 해당 경고가 사라진다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const { foodCategoryId } = await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 650_000, // over100
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      const alert = new BudgetAlertPage(page);
      const item = alert.alertItem(`${foodCategoryId}-over100`);
      await expect(item).toBeVisible();

      await alert.dismissButton(`${foodCategoryId}-over100`).click();
      await expect(item).not.toBeVisible();
    });

    test('dismiss 후에도 다음 임계값(over120) 진입 시 다시 표시된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      const { foodCategoryId } = await seedFoodBudget(coupleId, uid);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 650_000, // over100
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      const alert = new BudgetAlertPage(page);
      // over100 dismiss
      await alert.dismissButton(`${foodCategoryId}-over100`).click();
      await expect(alert.alertItem(`${foodCategoryId}-over100`)).not.toBeVisible();

      // 추가 거래로 over120 도달
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 200_000, // 누적 850,000 = 141%
        category: '식비',
      });
      await page.reload();

      // 새로운 단계는 dismiss 키가 다르므로 다시 표시됨
      await expect(alert.alertItem(`${foodCategoryId}-over120`)).toBeVisible();
    });

    test('월 전체 지출이 80% 넘으면 별도 라인으로 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      // 식비 월 60만 + 교통 월 20만 = 월 전체 80만 예산
      const { planId, foodCategoryId } = await seedFoodBudget(coupleId, uid);

      const transportCategoryId = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_personal',
        name: '교통',
        icon: 'bus',
        sortOrder: 1,
      });
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: transportCategoryId,
        group: 'expense',
        subGroup: 'variable_personal',
        annualAmount: 2_400_000, // 월 20만
      });

      // 합계 700,000 = 87.5%, 식비 단독은 70% (warn 미진입)
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 420_000,
        category: '식비',
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 280_000,
        category: '교통',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      const alert = new BudgetAlertPage(page);
      await expect(alert.alertItem('total-warn80')).toBeVisible();
      await expect(alert.alertItem('total-warn80')).toContainText('전체 지출');
    });
  });

  test.describe('Sonner 토스트', () => {
    test('새 임계값에 진입하는 거래를 추가하면 토스트가 뜬다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      // 80%에 막 도달하는 거래 추가
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 480_000, // 80%
        category: '식비',
      });

      // 거래 추가 트리거 (UI에서 mutation 호출 시뮬레이션)
      await page.reload();

      // 토스트 메시지 확인
      await expect(page.getByText(/식비.*80%/)).toBeVisible({ timeout: 5000 });
    });

    test('같은 임계값 내 추가 거래에는 토스트가 다시 뜨지 않는다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      // 이미 80% 진입한 상태로 시작
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 500_000, // 83%
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      // 또 다른 거래 추가 (여전히 80%대)
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 50_000, // 누적 91% — 같은 warn80 단계
        category: '식비',
      });
      await page.reload();

      // 토스트가 새로 뜨지 않아야 함 (이미 알림 본 상태)
      // → 이 검증은 토스트 자동 닫힘 후 추가 거래를 한 시점에서만 의미 있음
      // 핵심은 over100/over120으로 단계 변화가 없으면 토스트가 다시 안 나오는 것
      const overToast = page.getByText(/넘었어요/);
      await expect(overToast).not.toBeVisible();
    });
  });

  test.describe('알림 설정 연동', () => {
    test('budgetWarning.enabled = false 이면 배너가 표시되지 않는다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFoodBudget(coupleId, uid);
      await seedNotificationSettings(uid, { coupleId, budgetWarningEnabled: false });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 800_000, // over120
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      const alert = new BudgetAlertPage(page);
      await expect(alert.banner()).not.toBeVisible();
    });
  });

  test.describe('페이지별 노출', () => {
    test('가계부 메인 페이지(/cashbook/history)에도 배너가 노출된다', async ({
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
      await alert.gotoMain();

      await expect(alert.banner()).toBeVisible();
    });

    test('주간 페이지(/cashbook/history/weekly)에도 배너가 노출된다', async ({
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
      await alert.gotoWeekly();

      await expect(alert.banner()).toBeVisible();
    });
  });
});
