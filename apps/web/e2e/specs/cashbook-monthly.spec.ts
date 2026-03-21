import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedDefaultCategories,
  seedCashbookEntry,
  seedAnnualPlan,
  seedAnnualPlanItem,
  seedCashBalance,
} from '../helpers/emulator';
import { CashbookMonthlyPage } from '../page-objects/CashbookMonthlyPage';

/**
 * 월간 대시보드 E2E 테스트를 위한 시드 데이터 헬퍼.
 * 연간 계획 + 카테고리 + 월별 항목을 한 번에 생성.
 */
async function seedMonthlyData(
  coupleId: string,
  uid: string,
  options: {
    year?: number;
    incomeEntries?: { category: string; amount: number; date?: string }[];
    expenseEntries?: { category: string; amount: number; date?: string }[];
    investmentEntries?: { category: string; amount: number; date?: string }[];
    annualItems?: {
      categoryId: string;
      group: string;
      subGroup: string;
      annualAmount: number;
      monthlyAmount?: number | null;
    }[];
  } = {}
) {
  const year = options.year ?? new Date().getFullYear();

  // 기본 카테고리 생성
  await seedDefaultCategories(coupleId);

  // 연간 계획 생성
  const planId = await seedAnnualPlan(coupleId, year, uid);

  // 연간 계획 항목 생성
  if (options.annualItems) {
    for (const item of options.annualItems) {
      await seedAnnualPlanItem(coupleId, planId, item);
    }
  }

  // 수입 내역
  if (options.incomeEntries) {
    for (const entry of options.incomeEntries) {
      await seedCashbookEntry(coupleId, uid, {
        type: 'income',
        amount: entry.amount,
        category: entry.category,
        date: entry.date,
      });
    }
  }

  // 지출 내역
  if (options.expenseEntries) {
    for (const entry of options.expenseEntries) {
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: entry.amount,
        category: entry.category,
        date: entry.date,
      });
    }
  }

  // 투자 내역
  if (options.investmentEntries) {
    for (const entry of options.investmentEntries) {
      await seedCashbookEntry(coupleId, uid, {
        type: 'investment',
        amount: entry.amount,
        category: entry.category,
        date: entry.date,
      });
    }
  }

  return { planId };
}

test.describe('월간 대시보드', () => {
  test.describe('현황 카드', () => {
    test('수입/지출 프로그레스 바와 잔액이 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      // 카테고리 ID는 seedDefaultCategories에서 생성된 것 사용
      // annualItems 없이도 현황 카드는 실적 데이터만으로 렌더링 가능
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      // 수입 예산: 연간 4,200만 = 월 350만
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-income-salary',
        group: 'income',
        subGroup: 'regular_income',
        annualAmount: 42000000,
      });
      // 지출 예산: 연간 3,600만 = 월 300만
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense-food',
        group: 'expense',
        subGroup: 'variable_common',
        annualAmount: 36000000,
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

      // 현황 카드 표시 확인
      await expect(monthly.overviewCard).toBeVisible();

      // 수입 금액 표시 (.first()로 실적 span만 선택 — 예산과 값이 같을 때 strict mode 방지)
      await expect(monthly.overviewCard.getByText('3,500,000원').first()).toBeVisible();

      // 지출 금액 표시
      await expect(monthly.overviewCard.getByText('1,860,000원').first()).toBeVisible();

      // 잔액 표시 (수입 - 지출 = 1,640,000)
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
        annualAmount: 36000000, // 월 300만
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 1000000, // 100만 지출 → 여유분 200만 (66%)
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
        annualAmount: 36000000, // 월 300만
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 2700000, // 270만 지출 → 여유분 30만 (10%)
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
        annualAmount: 36000000, // 월 300만
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 3500000, // 350만 지출 → 여유분 -50만
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
        annualAmount: 7200000, // 월 60만
      });

      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 390000,
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      // 지출 탭 클릭 (기본 탭)
      await expect(monthly.expenseTab).toBeVisible();

      // 카테고리별 지출 섹션이 표시됨
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
        annualAmount: 7200000,
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      await expect(page.getByText('주별 지출 추이')).toBeVisible();
      await expect(monthly.weeklyTable()).toBeVisible();
      // 최소 1주차가 보여야 함
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
        annualAmount: 42000000,
      });

      // 정기 급여 실제 입력
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

      // 폼 열기 → 입력 → 저장
      await addButton.click();

      const sheet = page.getByRole('dialog');
      await expect(sheet).toBeVisible();

      // EntryForm은 기본 '지출' 탭 → '수입' 탭 전환
      await sheet.getByRole('tab', { name: '수입' }).click();

      // 금액 입력
      await sheet.getByLabel('금액').fill('250000');

      // 카테고리 선택 (부업)
      await sheet.getByRole('button', { name: '부업' }).click();

      // 저장
      await sheet.getByRole('button', { name: '저장' }).click();

      // Sheet가 닫히고 수입 목록에 반영
      await expect(sheet).not.toBeVisible({ timeout: 5000 });
      await expect(page.getByText('250,000원')).toBeVisible();
    });
  });

  test.describe('재테크 탭', () => {
    test('투자 내역이 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-investment-stock',
        group: 'investment',
        subGroup: 'investment',
        annualAmount: 18000000,
      });

      await seedCashbookEntry(coupleId, uid, {
        type: 'investment',
        amount: 500000,
        category: '국내주식',
        transactionType: 'buy',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      await monthly.investmentTab.click();

      const section = monthly.investmentSection();
      await expect(section).toBeVisible();
      await expect(section.getByRole('heading', { name: '투자 내역', exact: true })).toBeVisible();
      // 매수 라벨이 표시되는지 확인
      await expect(section.getByText('매수')).toBeVisible();
    });

    test('투자 내역을 추가하면 목록에 반영된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-investment-stock',
        group: 'investment',
        subGroup: 'investment',
        annualAmount: 18000000,
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      await monthly.investmentTab.click();

      // 투자 내역 추가 버튼 클릭
      const addButton = page.getByRole('button', { name: /투자 내역 추가/ });
      await addButton.click();

      const sheet = page.getByRole('dialog');
      await expect(sheet).toBeVisible();

      // 카테고리 선택
      await sheet.getByRole('button', { name: '국내주식' }).click();

      // 거래 유형 선택 (매수)
      await sheet.getByRole('button', { name: '매수' }).click();

      // 금액 입력
      await sheet.getByLabel('금액').fill('500000');

      // 메모 입력
      await sheet.getByLabel('메모 (선택)').fill('삼성전자 10주');

      // 저장
      await sheet.getByRole('button', { name: '저장' }).click();

      // Sheet 닫힘 확인
      await expect(sheet).not.toBeVisible({ timeout: 5000 });

      // 투자 내역 목록에 반영 확인
      await expect(page.getByText('500,000원')).toBeVisible();
    });

    test('현금 잔고를 업데이트하면 반영된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      await seedAnnualPlan(coupleId, year, uid);

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      await monthly.investmentTab.click();

      // 잔고 업데이트 버튼 클릭
      const updateButton = page.getByRole('button', { name: /잔고 업데이트/ });
      await expect(updateButton).toBeVisible();
      await updateButton.click();

      const sheet = page.getByRole('dialog');
      await expect(sheet).toBeVisible();

      // 예적금 잔고 입력
      await sheet.getByLabel('예적금').fill('12000000');

      // 저장
      await sheet.getByRole('button', { name: '저장' }).click();

      // Sheet 닫힘 확인
      await expect(sheet).not.toBeVisible({ timeout: 5000 });

      // 잔고 반영 확인
      await expect(page.getByText('12,000,000원')).toBeVisible();
    });
  });

  test.describe('월 이동', () => {
    test('월 이동 시 해당 월 데이터로 갱신된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const year = new Date().getFullYear();
      const planId = await seedAnnualPlan(coupleId, year, uid);

      // 지출 예산 설정 (overview가 데이터를 표시하려면 budgetItems 필요)
      await seedAnnualPlanItem(coupleId, planId, {
        categoryId: 'cat-expense-food',
        group: 'expense',
        subGroup: 'variable_common',
        annualAmount: 3600000,
      });

      // 이번 달에 지출 추가
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 100000,
        category: '식비',
      });

      const monthly = new CashbookMonthlyPage(page);
      await monthly.goto();

      // 이번 달에 지출이 표시됨
      await expect(monthly.overviewCard.getByText('100,000원').first()).toBeVisible();

      // 이전 달로 이동 → 데이터 없음
      await monthly.prevMonthButton.click();

      // 이전 달에는 지출이 0원
      await expect(monthly.overviewCard.getByText('0원')).toBeVisible();
    });
  });
});
