import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedCashbookCategory, seedAnnualPlan, seedAnnualPlanItem } from '../helpers/emulator';
import { AnnualPlanPage } from '../page-objects/AnnualPlanPage';
import { AnnualPlanItemsPage } from '../page-objects/AnnualPlanItemsPage';

type SeedHandles = {
  planId: string;
  catIncomeRegular: string; // 정기급여 — has item
  catIncomeIrregular: string; // 상여 — has item
  catIncomeUnplanned: string; // 중고거래 — no item (for add test)
  catExpense: string;
  catFlex: string;
};

async function seedAnnualPlanWithItems(coupleId: string, uid: string): Promise<SeedHandles> {
  const year = new Date().getFullYear();
  const planId = await seedAnnualPlan(coupleId, year, uid);

  const catIncomeRegular = await seedCashbookCategory(coupleId, {
    group: 'income',
    subGroup: 'regular_income',
    name: '정기급여',
    icon: 'wallet',
    sortOrder: 0,
  });
  const catIncomeIrregular = await seedCashbookCategory(coupleId, {
    group: 'income',
    subGroup: 'irregular_income',
    name: '상여',
    icon: 'gift',
    sortOrder: 0,
  });
  const catIncomeUnplanned = await seedCashbookCategory(coupleId, {
    group: 'income',
    subGroup: 'irregular_income',
    name: '중고거래',
    icon: 'arrows_clockwise',
    sortOrder: 1,
  });
  const catExpense = await seedCashbookCategory(coupleId, {
    group: 'expense',
    subGroup: 'fixed_expense',
    name: '월세',
    icon: 'house',
    sortOrder: 0,
  });
  const catFlex = await seedCashbookCategory(coupleId, {
    group: 'flex',
    subGroup: 'joint_flex',
    name: '여행',
    icon: 'airplane',
    sortOrder: 0,
  });

  await seedAnnualPlanItem(coupleId, planId, {
    categoryId: catIncomeRegular,
    group: 'income',
    subGroup: 'regular_income',
    monthlyAmounts: Array(12).fill(3_000_000),
    inputMode: 'regular',
    baseMonthlyAmount: 3_000_000,
  });
  await seedAnnualPlanItem(coupleId, planId, {
    categoryId: catIncomeIrregular,
    group: 'income',
    subGroup: 'irregular_income',
    monthlyAmounts: [0, 0, 0, 0, 0, 0, 2_000_000, 0, 0, 0, 0, 0],
    inputMode: 'irregular',
  });
  await seedAnnualPlanItem(coupleId, planId, {
    categoryId: catExpense,
    group: 'expense',
    subGroup: 'fixed_expense',
    monthlyAmounts: Array(12).fill(800_000),
    inputMode: 'regular',
    baseMonthlyAmount: 800_000,
  });
  await seedAnnualPlanItem(coupleId, planId, {
    categoryId: catFlex,
    group: 'flex',
    subGroup: 'joint_flex',
    monthlyAmounts: Array(12)
      .fill(0)
      .map((_, i) => (i === 5 ? 2_000_000 : 0)),
    inputMode: 'irregular',
  });

  return {
    planId,
    catIncomeRegular,
    catIncomeIrregular,
    catIncomeUnplanned,
    catExpense,
    catFlex,
  };
}

test.describe('연간 예산 항목 (그룹별 drill-down)', () => {
  test('메인 카드 클릭 시 그룹별 항목 페이지로 이동하고 해당 그룹의 항목만 표시된다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedAnnualPlanWithItems(coupleId, uid);

    const annualPage = new AnnualPlanPage(page);
    await annualPage.goto();

    await expect(annualPage.goalCard('income')).toContainText('2개 항목');
    await annualPage.goalCardCta('income').click();

    const itemsPage = new AnnualPlanItemsPage(page);
    // Next.js dev mode가 새 라우트를 처음 compile할 때 5초 이상 걸릴 수 있어 timeout 여유 확보
    await expect(itemsPage.header).toBeVisible({ timeout: 30000 });
    await expect(page).toHaveURL(/\/inner\/cashbook\/plan\/annual\/items\?group=income/);
    await expect(itemsPage.itemRow('정기급여')).toBeVisible();
    await expect(itemsPage.itemRow('상여')).toBeVisible();

    // 다른 그룹 항목은 보이지 않아야 함
    await expect(itemsPage.itemRow('월세')).not.toBeVisible();
    await expect(itemsPage.itemRow('여행')).not.toBeVisible();
  });

  test('항목을 추가하면 리스트에 표시되고 메인 카드 합계·개수가 증가한다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedAnnualPlanWithItems(coupleId, uid);

    const annualPage = new AnnualPlanPage(page);
    await annualPage.goto();

    // 메인 카드에서 income 항목 수 캡처: 시드에 2개
    await expect(annualPage.goalCard('income')).toContainText('2개 항목');

    await annualPage.goalCardCta('income').click();

    const itemsPage = new AnnualPlanItemsPage(page);
    await itemsPage.addItem('중고거래', 1_200_000);

    await expect(itemsPage.itemRow('중고거래')).toBeVisible();

    // 메인으로 돌아가 카드 합계·개수 갱신 확인
    await itemsPage.backButton.click();
    await expect(annualPage.goalCard('income')).toContainText('3개 항목');
  });

  test('항목 금액을 편집하면 리스트와 메인 카드 합계에 반영된다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedAnnualPlanWithItems(coupleId, uid);

    const itemsPage = new AnnualPlanItemsPage(page);
    await itemsPage.goto('income');

    await expect(itemsPage.itemRow('정기급여')).toBeVisible();

    // 36,000,000 → 48,000,000
    await itemsPage.editAmount('정기급여', 48_000_000);

    // 행 금액 갱신
    await expect(itemsPage.itemRowAmount('정기급여')).toContainText('4,800만');

    // 메인 페이지 카드도 갱신 확인
    await itemsPage.backButton.click();
    const annualPage = new AnnualPlanPage(page);
    // 시드 합계: 36,000,000 + 2,000,000 = 38,000,000. 편집 후: 48,000,000 + 2,000,000 = 50,000,000
    await expect(annualPage.goalCardAmount('income')).toContainText('5,000만');
  });

  test('항목을 삭제하면 리스트에서 사라지고 메인 카드 개수가 감소한다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedAnnualPlanWithItems(coupleId, uid);

    const itemsPage = new AnnualPlanItemsPage(page);
    await itemsPage.goto('income');

    await itemsPage.deleteItem('상여');
    await expect(itemsPage.itemRow('상여')).not.toBeVisible();

    await itemsPage.backButton.click();
    const annualPage = new AnnualPlanPage(page);
    await expect(annualPage.goalCard('income')).toContainText('1개 항목');
  });
});
