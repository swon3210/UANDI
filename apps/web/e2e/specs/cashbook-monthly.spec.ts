import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedDefaultCategories,
  seedCashbookCategory,
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
      // 수입 실적과 예산이 같은 금액이라 exact로 한정 (실적 span만 매칭)
      await expect(monthly.overviewCard.getByText('3,500,000원', { exact: true })).toBeVisible();
      await expect(monthly.overviewCard.getByText('1,860,000원', { exact: true })).toBeVisible();
      await expect(monthly.overviewCard.getByText('1,640,000원', { exact: true })).toBeVisible();
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

    test('카테고리 행을 누르면 해당 월·카테고리로 필터된 내역으로 이동한다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      // 카테고리 이름이 행에 뜨려면 예산 항목의 categoryId가 실제 카테고리 문서와 매칭돼야 한다.
      const foodId = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '식비',
        icon: 'bowl_food',
        sortOrder: 0,
      });
      await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_personal',
        name: '교통',
        icon: 'bus',
        sortOrder: 1,
      });

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: foodId,
        group: 'expense',
        subGroup: 'variable_common',
        monthlyAmounts: Array(12).fill(600000),
      });

      // 식비 1건 + 다른 카테고리(교통) 1건 → 식비만 필터되는지 확인
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 390000,
        category: '식비',
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 50000,
        category: '교통',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      await monthly.categoryRow('식비').click();

      // 내역 페이지로 이동 + 식비 카테고리로 필터됨(필터 결과 1건)
      const summary = page.getByTestId('filter-result-summary');
      await expect(summary).toBeVisible();
      await expect(summary).toContainText('1건');
      // 식비 실적은 보이고, 필터에서 빠진 교통(50,000원)은 보이지 않는다
      await expect(page.getByText('390,000원').first()).toBeVisible();
      await expect(page.getByText('50,000원')).not.toBeVisible();
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
      // '정기 수입'은 '비정기 수입' 헤딩/버튼의 부분문자열이라 heading + exact로 한정
      await expect(
        incomeSection.getByRole('heading', { name: '정기 수입', exact: true })
      ).toBeVisible();
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
      // 추가된 비정기 수입(250,000원)은 현황·목록 등 여러 곳에 표시되므로 첫 매칭만 확인
      await expect(page.getByText('250,000원').first()).toBeVisible();
    });
  });

  test.describe('월 이동', () => {
    test('월 이동 시 해당 월 데이터로 갱신된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);
      // 현황 카드는 예산(연간 플랜) 기준으로 계산되므로 플랜을 시드한다.
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense-food',
        group: 'expense',
        subGroup: 'variable_common',
        monthlyAmounts: Array(12).fill(600000),
      });

      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 100000,
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      // 이번 달: 지출 실적 100,000원 표시 (예산 600,000원과 구분 위해 exact)
      await expect(monthly.overviewCard.getByText('100,000원', { exact: true })).toBeVisible();

      // 이전 달로 이동하면 해당 월(지출 없음) 데이터로 갱신된다
      await monthly.prevMonthButton.click();
      await expect(
        monthly.overviewCard.getByText('100,000원', { exact: true })
      ).not.toBeVisible();
    });
  });

  test.describe('카테고리 정렬', () => {
    // 식비 60만(초과) + 여가 100만(여유) 예산을 시드한다.
    // 여가 예산을 먼저 추가해 기본 순서가 초과순과 다르도록 만든다.
    async function seedOverAndUnder(coupleId: string, uid: string) {
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      const leisureId = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_personal',
        name: '여가',
        icon: 'movie',
        sortOrder: 0,
      });
      const foodId = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '식비',
        icon: 'bowl_food',
        sortOrder: 1,
      });

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: leisureId,
        group: 'expense',
        subGroup: 'variable_personal',
        monthlyAmounts: Array(12).fill(1_000_000), // 월 100만
      });
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: foodId,
        group: 'expense',
        subGroup: 'variable_common',
        monthlyAmounts: Array(12).fill(600_000), // 월 60만
      });

      await seedCashbookEntry(coupleId, uid, { type: 'expense', amount: 800_000, category: '식비' }); // 133%
      await seedCashbookEntry(coupleId, uid, { type: 'expense', amount: 100_000, category: '여가' }); // 10%
    }

    async function rowTop(page: import('@playwright/test').Page, name: string): Promise<number> {
      const box = await page.getByTestId(`category-budget-${name}`).boundingBox();
      if (!box) throw new Error(`카테고리 행을 찾을 수 없음: ${name}`);
      return box.y;
    }

    test('?sort=over로 진입하면 초과 카테고리가 맨 위에 정렬된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedOverAndUnder(coupleId, uid);

      await page.goto('/inner/cashbook/history/monthly?sort=over');
      await page.waitForSelector('[data-testid="monthly-overview"]', { timeout: 15000 });

      await expect(page.getByTestId('category-budget-식비')).toBeVisible();
      await expect(page.getByTestId('category-budget-여가')).toBeVisible();
      expect(await rowTop(page, '식비')).toBeLessThan(await rowTop(page, '여가'));
    });

    test('정렬 컨트롤로 초과순을 선택하면 초과 카테고리가 맨 위로 온다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedOverAndUnder(coupleId, uid);

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto(); // 기본순 진입

      await expect(page.getByTestId('category-sort-select')).toBeVisible();
      await page.getByTestId('category-sort-select').click();
      await page.getByRole('option', { name: '초과순' }).click();

      expect(await rowTop(page, '식비')).toBeLessThan(await rowTop(page, '여가'));
    });
  });
});
