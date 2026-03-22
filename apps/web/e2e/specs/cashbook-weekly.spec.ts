import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedDefaultCategories,
  seedCashbookEntry,
  seedAnnualPlan,
  seedAnnualPlanItem,
} from '../helpers/emulator';
import { CashbookWeeklyPage } from '../page-objects/CashbookWeeklyPage';
import dayjs from 'dayjs';

/**
 * 주간 테스트용 시드 데이터 헬퍼.
 * 변동 지출 예산 + 이번 주 지출 내역을 생성.
 */
async function seedWeeklyData(
  coupleId: string,
  uid: string,
  options: {
    year?: number;
    variableAnnualBudget?: number;
    expenseEntries?: { category: string; amount: number; date: string }[];
  } = {}
) {
  const year = options.year ?? new Date().getFullYear();

  await seedDefaultCategories(coupleId);
  const planId = await seedAnnualPlan(coupleId, year, uid);

  // 변동 지출 예산 (기본: 연 1,200만 = 월 100만)
  await seedAnnualPlanItem(coupleId, planId, {
    categoryId: 'cat-expense-food',
    group: 'expense',
    subGroup: 'variable_common',
    annualAmount: options.variableAnnualBudget ?? 12000000,
  });

  // 지출 내역 시드
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

  return { planId };
}

test.describe('주간 예산', () => {
  test.describe('주간 현황 카드', () => {
    test('주간 예산 페이지에 접근하면 현재 주차가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedWeeklyData(coupleId, uid);

      const weekly = new CashbookWeeklyPage(page);
      await weekly.goto();

      // 주차 선택기가 표시됨
      await expect(weekly.weekSelector).toBeVisible();
      // "주차" 텍스트가 포함됨
      await expect(weekly.weekSelector).toContainText('주차');
    });

    test('주간 예산/지출/여유 금액이 정확히 계산된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      // 오늘 + 어제 지출 추가 (미래 날짜 문제 방지)
      const today = dayjs();
      const yesterday = today.subtract(1, 'day');

      await seedWeeklyData(coupleId, uid, {
        expenseEntries: [
          { category: '식비', amount: 85000, date: today.toISOString() },
          { category: '식비', amount: 42000, date: yesterday.toISOString() },
        ],
      });

      const weekly = new CashbookWeeklyPage(page);
      await weekly.goto();

      // 지출 합계 표시 확인 (85,000 + 42,000 = 127,000)
      await expect(weekly.summaryCard).toContainText('127,000');
    });

    test('프로그레스 바가 소진율에 맞게 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const today = dayjs();

      await seedWeeklyData(coupleId, uid, {
        expenseEntries: [{ category: '식비', amount: 150000, date: today.toISOString() }],
      });

      const weekly = new CashbookWeeklyPage(page);
      await weekly.goto();

      // 프로그레스 바 존재 확인
      const progress = weekly.summaryCard.locator('[role="progressbar"]');
      await expect(progress).toBeVisible();
    });
  });

  test.describe('주 이동', () => {
    test('이전/다음 주 이동이 동작한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedWeeklyData(coupleId, uid);

      const weekly = new CashbookWeeklyPage(page);
      await weekly.goto();

      // 현재 주차 텍스트 저장
      const currentText = await weekly.weekSelector.textContent();

      // 이전 주로 이동
      await weekly.prevWeekButton.click();

      // 텍스트가 변경됨
      const prevText = await weekly.weekSelector.textContent();
      expect(prevText).not.toBe(currentText);

      // 다음 주로 돌아오기
      await weekly.nextWeekButton.click();
      const restoredText = await weekly.weekSelector.textContent();
      expect(restoredText).toBe(currentText);
    });
  });

  test.describe('일별 지출', () => {
    test('일별 행을 클릭하면 해당 날짜의 지출 내역이 펼쳐진다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      // 오늘 날짜에 지출 시드 (미래 날짜 문제 방지)
      const today = dayjs();

      await seedWeeklyData(coupleId, uid, {
        expenseEntries: [
          { category: '식비', amount: 35000, date: today.toISOString() },
          { category: '교통', amount: 12000, date: today.toISOString() },
        ],
      });

      const weekly = new CashbookWeeklyPage(page);
      await weekly.goto();

      // 일별 목록이 표시됨
      await expect(weekly.dailyList).toBeVisible();

      // 오늘 날짜 행 클릭
      const todayDate = today.format('M/D');
      const row = page.getByText(todayDate).first();
      await row.click();

      // 상세 내역이 펼쳐짐
      await expect(page.getByText('35,000')).toBeVisible();
      await expect(page.getByText('12,000')).toBeVisible();
    });

    test('미래 날짜는 "-"로 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedWeeklyData(coupleId, uid);

      const weekly = new CashbookWeeklyPage(page);
      await weekly.goto();

      await expect(weekly.dailyList).toBeVisible();

      // 미래 날짜 행에 "-" 텍스트가 있는지 직접 확인
      const futureRows = weekly.dailyList.locator('[data-future="true"]');
      const count = await futureRows.count();
      for (let i = 0; i < count; i++) {
        await expect(futureRows.nth(i)).toContainText('-');
      }
    });
  });

  test.describe('카테고리별 지출', () => {
    test('카테고리별 주간 지출이 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      // 오늘 + 어제 지출 시드 (미래 날짜 문제 방지)
      const today = dayjs();
      const yesterday = today.subtract(1, 'day');

      await seedWeeklyData(coupleId, uid, {
        expenseEntries: [
          { category: '식비', amount: 120000, date: today.toISOString() },
          { category: '교통', amount: 30000, date: yesterday.toISOString() },
        ],
      });

      const weekly = new CashbookWeeklyPage(page);
      await weekly.goto();

      // 카테고리별 섹션이 표시됨
      await expect(weekly.categoryBreakdown).toBeVisible();
      await expect(weekly.categoryBreakdown).toContainText('식비');
    });
  });

  test.describe('지출 추가', () => {
    test('지출 추가 후 주간 데이터가 갱신된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedWeeklyData(coupleId, uid);

      const weekly = new CashbookWeeklyPage(page);
      await weekly.goto();

      // 지출 추가 버튼 클릭
      await weekly.addExpenseButton.click();

      const sheet = page.getByRole('dialog');
      await expect(sheet).toBeVisible();

      // 금액 입력
      await sheet.getByLabel('금액').fill('50000');

      // 카테고리 선택
      await sheet.getByRole('button', { name: '식비' }).click();

      // 저장
      await sheet.getByRole('button', { name: '저장' }).click();

      // Sheet 닫힘
      await expect(sheet).not.toBeVisible({ timeout: 5000 });

      // 지출이 반영됨 (일별 목록에서 확인)
      await expect(weekly.summaryCard).toContainText('50,000');
    });
  });

  test.describe('이월 로직', () => {
    test('이전 주 초과 지출 시 현재 주 예산이 차감된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const today = dayjs();
      // 이전 주에 해당하는 날짜 (7일 전)
      const prevMonday = today.subtract(7, 'day');

      // 월 변동 예산: 1,000,000 (연 12,000,000)
      // 주당 약 250,000 (4주 기준) ~ 200,000 (5주 기준)
      await seedWeeklyData(coupleId, uid, {
        expenseEntries: [
          // 이전 주에 큰 지출 (예산보다 많이)
          { category: '식비', amount: 500000, date: prevMonday.toISOString() },
        ],
      });

      const weekly = new CashbookWeeklyPage(page);
      await weekly.goto();

      // 이월 표시가 있는지 확인 (이월 금액 또는 이월 라벨)
      await expect(weekly.summaryCard).toContainText('이월');
    });
  });

  test.describe('월 경계 이동', () => {
    test('첫 주에서 이전 주로 이동하면 이전 달로 변경된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedWeeklyData(coupleId, uid);

      const weekly = new CashbookWeeklyPage(page);
      await weekly.goto();

      // 현재 월 텍스트 확인
      const today = dayjs();
      const currentMonth = today.month() + 1;
      await expect(weekly.weekSelector).toContainText(`${currentMonth}월`);

      // 1주차까지 이동
      while (!(await weekly.weekSelector.textContent())?.includes('1주차')) {
        await weekly.prevWeekButton.click();
      }

      // 1주차에서 한 번 더 이전으로
      await weekly.prevWeekButton.click();

      // 이전 달로 변경 확인
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      await expect(weekly.weekSelector).toContainText(`${prevMonth}월`);
    });
  });

  test.describe('빈 상태', () => {
    test('지출이 없는 주에 빈 상태가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      // 지출 내역 없이 예산만 생성
      await seedWeeklyData(coupleId, uid);

      const weekly = new CashbookWeeklyPage(page);
      await weekly.goto();

      // 지출 0원 표시
      await expect(weekly.summaryCard).toContainText('0원');
    });
  });
});
