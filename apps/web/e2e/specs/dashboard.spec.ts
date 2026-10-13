import { expect } from '@playwright/test';
import dayjs from 'dayjs';
import { test } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects/DashboardPage';
import {
  seedCashbookCategory,
  seedCashbookEntry,
  seedDefaultCategories,
} from '../helpers/emulator';

test.describe('대시보드', () => {
  test.describe('레이아웃', () => {
    test('로그인 후 대시보드에 Header가 표시된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.header).toBeVisible();
    });

    test('최근 사진 영역과 이번 달 가계부 요약 영역은 더 이상 표시되지 않는다', async ({
      authedPage,
    }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.recentPhotosSection).toHaveCount(0);
      await expect(dashboard.monthlySummarySection).toHaveCount(0);
    });
  });

  test.describe('진입점', () => {
    test('합계 카드 클릭 시 가계부 내역 페이지로 이동한다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      // 전체 탭(기본)엔 합계 카드가 없으므로 지출 탭에서 진입
      await dashboard.groupTabExpense.click();
      await expect(dashboard.totalAmount).toBeVisible();
      await dashboard.totalAmount.click();
      await expect(authedPage).toHaveURL(/\/inner\/cashbook\/history/, { timeout: 30000 });
    });

    test('주간 기간이 내역 페이지에 그대로 적용된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.groupTabExpense.click();
      await dashboard.totalAmount.click();
      await expect(authedPage).toHaveURL(/\/inner\/cashbook\/history/, { timeout: 30000 });

      const start = dayjs().startOf('week');
      const end = dayjs().endOf('week');
      await expect(authedPage.getByTestId('cashbook-period-label')).toHaveText(
        `${start.format('YYYY. M. D.')} ~ ${end.format('YYYY. M. D.')}`
      );
      // 지출 탭 → 내역 페이지에 지출 타입 필터 1개 적용
      await expect(authedPage.getByTestId('cashbook-filter-count')).toHaveText('1');
    });

    test('월간 + 지출 탭 상태가 내역 페이지의 기간·타입 필터로 적용된다', async ({
      authedPage,
    }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabMonthly.click();
      await dashboard.periodPrevButton.click();
      await dashboard.groupTabExpense.click();
      await dashboard.totalAmount.click();
      await expect(authedPage).toHaveURL(/\/inner\/cashbook\/history/, { timeout: 30000 });

      const prevMonth = dayjs().subtract(1, 'month');
      await expect(authedPage.getByTestId('cashbook-year-label')).toHaveText(
        `${prevMonth.year()}년`
      );
      await expect(authedPage.getByTestId('cashbook-period-label')).toHaveText(
        `${prevMonth.month() + 1}월`
      );
      await expect(authedPage.getByTestId('cashbook-filter-count')).toHaveText('1');
    });

    test('연간 기간이 내역 페이지에 그대로 적용된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabYearly.click();
      await dashboard.periodPrevButton.click();
      await dashboard.groupTabExpense.click();
      await dashboard.totalAmount.click();
      await expect(authedPage).toHaveURL(/\/inner\/cashbook\/history/, { timeout: 30000 });

      const year = dayjs().year() - 1;
      await expect(authedPage.getByTestId('cashbook-period-label')).toHaveText(
        `${year}. 1. 1. ~ ${year}. 12. 31.`
      );
    });
  });

  test.describe('가계부 대시보드 — 컨트롤', () => {
    test('기본값으로 주간 + 전체 탭이 활성화된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.periodSelector).toBeVisible();
      await expect(dashboard.groupTabs).toBeVisible();
      await expect(dashboard.periodTabWeekly).toHaveAttribute('data-state', 'active');
      await expect(dashboard.groupTabAll).toHaveAttribute('data-state', 'active');
    });

    test('기간 네비게이터에 현재 주 라벨이 표시된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      // weekly 라벨은 'M월 D일 ~ D일' 패턴
      await expect(dashboard.periodNavLabel).toContainText(/\d+월 \d+일\s*~\s*\d+일/);
    });

    test('우측 화살표는 현재 기간일 때 비활성화된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.periodNextButton).toBeDisabled();
    });

    test('좌측 화살표 클릭 시 이전 주로 이동하고 우측 화살표가 활성화된다', async ({
      authedPage,
    }) => {
      const dashboard = new DashboardPage(authedPage);

      await dashboard.periodPrevButton.click();

      // 여전히 주 단위 라벨 패턴 유지
      await expect(dashboard.periodNavLabel).toContainText(/\d+월 \d+일\s*~\s*\d+일/);
      await expect(dashboard.periodNextButton).toBeEnabled();
    });

    test('월간 탭 선택 시 라벨이 월 단위로 바뀐다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabMonthly.click();

      const expected = dayjs().format('YYYY년 M월');
      await expect(dashboard.periodNavLabel).toContainText(expected);
    });

    test('연간 탭 선택 시 라벨이 연도로 바뀐다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabYearly.click();

      const expected = `${dayjs().year()}년`;
      await expect(dashboard.periodNavLabel).toContainText(expected);
    });
  });

  test.describe('가계부 대시보드 — 기간 직접 선택', () => {
    test('월간: 라벨 클릭 시 월 선택 시트가 열리고 고른 월로 이동한다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabMonthly.click();
      await dashboard.periodNavLabel.click();

      await expect(dashboard.periodPickerSheet).toBeVisible();
      await expect(dashboard.periodPickerTitle).toHaveText(`${dayjs().year()}년`);

      await dashboard.periodPickerPrev.click();
      const lastYear = dayjs().year() - 1;
      await expect(dashboard.periodPickerTitle).toHaveText(`${lastYear}년`);
      await dashboard.periodPickerMonth(3).click();

      await expect(dashboard.periodPickerSheet).toBeHidden();
      await expect(dashboard.periodNavLabel).toHaveText(`${lastYear}년 3월`);
      await expect(dashboard.periodNextButton).toBeEnabled();
    });

    test('월간: 미래의 월은 선택할 수 없다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabMonthly.click();
      await dashboard.periodNavLabel.click();

      await expect(dashboard.periodPickerNext).toBeDisabled();
      const now = dayjs();
      if (now.month() < 11) {
        await expect(dashboard.periodPickerMonth(now.month() + 2)).toBeDisabled();
      }
      await expect(dashboard.periodPickerMonth(now.month() + 1)).toBeEnabled();
    });

    test('주간: 달력에서 날짜를 고르면 그 날짜가 속한 주로 이동한다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodNavLabel.click();
      await expect(dashboard.periodPickerSheet).toBeVisible();

      await dashboard.periodPickerPrev.click();
      const target = dayjs().subtract(1, 'month').date(15);
      await dashboard.periodPickerDay(target.format('YYYY-MM-DD')).click();

      await expect(dashboard.periodPickerSheet).toBeHidden();
      const start = target.startOf('week');
      const end = target.endOf('week');
      await expect(dashboard.periodNavLabel).toHaveText(
        `${start.format('M월 D일')} ~ ${end.format('D일')}`
      );
    });

    test('연간: 연도 목록에서 고른 연도로 이동한다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabYearly.click();
      await dashboard.periodNavLabel.click();
      await expect(dashboard.periodPickerSheet).toBeVisible();

      const target = dayjs().year() - 2;
      await dashboard.periodPickerYear(target).click();

      await expect(dashboard.periodPickerSheet).toBeHidden();
      await expect(dashboard.periodNavLabel).toHaveText(`${target}년`);
    });
  });

  test.describe('가계부 대시보드 — 차트 렌더링', () => {
    test('데이터가 없을 때 빈 상태 메시지가 표시된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.emptyState).toBeVisible();
    });

    test('지출 내역 시드 후 시계열 차트와 카테고리 도넛이 모두 렌더된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const today = dayjs().toISOString();
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 12000,
        category: '식비',
        date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 8000,
        category: '교통',
        date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'income',
        amount: 1000000,
        category: '정기급여',
        date: today,
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();

      await expect(dashboard.trendChart).toBeVisible({ timeout: 10000 });
      await expect(dashboard.categoryDonut).toBeVisible();
      // 합계 KPI: 지출 탭 = 지출 합계 20,000
      await expect(dashboard.totalAmount).toContainText('지출 합계');
      await expect(dashboard.totalAmount).toContainText('20,000');
    });

    test('전체 탭은 지출·수입·FLEX 총량 파이 차트만 보여준다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const today = dayjs().toISOString();
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 300000,
        category: '식비',
        date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'income',
        amount: 1000000,
        category: '정기급여',
        date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'flex',
        amount: 100000,
        category: '여행',
        date: today,
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      await expect(dashboard.groupTabAll).toHaveAttribute('data-state', 'active');
      await expect(dashboard.categoryDonut).toContainText('지출');
      await expect(dashboard.categoryDonut).toContainText('수입');
      await expect(dashboard.categoryDonut).toContainText('FLEX');
      // 카테고리 이름이 아니라 유형으로 묶인다
      await expect(dashboard.categoryDonut).not.toContainText('식비');
      // 합계 카드·고정/변동 필터·기간 비교는 전체 탭에서 숨김
      await expect(dashboard.totalAmount).toBeHidden();
      await expect(dashboard.subGroupTabs).toBeHidden();
      await expect(dashboard.periodCompare).toBeHidden();
    });

    test('지출 탭으로 전환 시 카테고리 도넛에 지출 카테고리만 표시된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const today = dayjs().toISOString();
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 12000,
        category: '식비',
        date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'income',
        amount: 1000000,
        category: '정기급여',
        date: today,
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      await expect(dashboard.categoryDonut).toContainText('식비');
      await expect(dashboard.categoryDonut).not.toContainText('정기급여');
      await expect(dashboard.totalAmount).toContainText('12,000');
    });
  });

  test.describe('고정/변동 세부 필터', () => {
    async function seedFixedAndVariable(coupleId: string, uid: string) {
      await seedDefaultCategories(coupleId);
      const today = dayjs().toISOString();
      // 지출: 월세(고정) 20,000 / 식비(변동) 50,000
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 20000,
        category: '월세',
        date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 50000,
        category: '식비',
        date: today,
      });
      // 수입: 정기급여(고정) 1,000,000 / 부업(변동) 300,000
      await seedCashbookEntry(coupleId, uid, {
        type: 'income',
        amount: 1000000,
        category: '정기급여',
        date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'income',
        amount: 300000,
        category: '부업',
        date: today,
      });
    }

    test('지출 탭에서만 보이고 전체·FLEX 탭에서는 고정/변동 필터가 보이지 않는다', async ({
      authedPage,
    }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.subGroupTabs).toBeHidden();
      await dashboard.groupTabExpense.click();
      await expect(dashboard.subGroupTabs).toBeVisible();
      await dashboard.groupTabFlex.click();
      await expect(dashboard.subGroupTabs).toBeHidden();
    });

    test('지출 탭에서 고정 지출/변동 지출만 따로 볼 수 있다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFixedAndVariable(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();

      await expect(dashboard.subGroupTabs).toBeVisible();
      await expect(dashboard.totalAmount).toContainText('70,000');

      await dashboard.subGroupTab('고정 지출').click();
      await expect(dashboard.totalAmount).toContainText('고정 지출 합계');
      await expect(dashboard.totalAmount).toContainText('20,000');
      await expect(dashboard.categoryDonut).toContainText('월세');
      await expect(dashboard.categoryDonut).not.toContainText('식비');

      await dashboard.subGroupTab('변동 지출').click();
      await expect(dashboard.totalAmount).toContainText('변동 지출 합계');
      await expect(dashboard.totalAmount).toContainText('50,000');
      await expect(dashboard.categoryDonut).toContainText('식비');
      await expect(dashboard.categoryDonut).not.toContainText('월세');
    });

    test('수입 탭에서 고정 수입/변동 수입만 따로 볼 수 있다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFixedAndVariable(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabIncome.click();

      await dashboard.subGroupTab('고정 수입').click();
      await expect(dashboard.totalAmount).toContainText('1,000,000');
      await expect(dashboard.categoryDonut).toContainText('정기급여');
      await expect(dashboard.categoryDonut).not.toContainText('부업');

      await dashboard.subGroupTab('변동 수입').click();
      await expect(dashboard.totalAmount).toContainText('300,000');
      await expect(dashboard.categoryDonut).toContainText('부업');
      await expect(dashboard.categoryDonut).not.toContainText('정기급여');
    });

    test('그룹 탭을 바꾸면 세부 필터는 전체로 돌아간다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFixedAndVariable(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('고정 지출').click();
      await dashboard.groupTabIncome.click();

      await expect(dashboard.subGroupTab('전체 수입')).toHaveAttribute('data-state', 'active');
      await expect(dashboard.totalAmount).toContainText('1,300,000');
    });
  });

  test.describe('지출·수입 전체 — 고정/변동 도넛과 총액 비교', () => {
    async function seedOverview(coupleId: string, uid: string) {
      await seedDefaultCategories(coupleId);
      const today = dayjs().toISOString();
      const rows: Array<['expense' | 'income', string, number]> = [
        ['expense', '월세', 20000], // 고정
        ['expense', '보험', 10000], // 고정
        ['expense', '식비', 50000], // 변동
        ['income', '정기급여', 1000000], // 고정
        ['income', '부업', 300000], // 변동
      ];
      for (const [type, category, amount] of rows) {
        await seedCashbookEntry(coupleId, uid, { type, amount, category, date: today });
      }
    }

    test('전체 지출 도넛은 기본으로 고정/변동 지출만 보여준다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedOverview(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();

      await expect(dashboard.categoryDonutItem('고정 지출')).toContainText('3만');
      await expect(dashboard.categoryDonutItem('변동 지출')).toContainText('5만');
      await expect(dashboard.categoryDonutItem('식비')).toHaveCount(0);
      await expect(dashboard.totalAmount).toContainText('80,000');
    });

    test('카테고리를 고르면 도넛과 지출 합계가 고른 카테고리만 반영한다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedOverview(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();

      await dashboard.donutCategoryButton.click();
      await expect(dashboard.compareCategorySheet).toContainText('표시할 카테고리 선택');
      await dashboard.compareCategoryOption('월세').click();
      await dashboard.compareCategoryOption('식비').click();
      await dashboard.compareCategoryApply.click();

      await expect(dashboard.categoryDonutItem('월세')).toBeVisible();
      await expect(dashboard.categoryDonutItem('식비')).toBeVisible();
      await expect(dashboard.categoryDonutItem('보험')).toHaveCount(0);
      await expect(dashboard.categoryDonutItem('고정 지출')).toHaveCount(0);
      await expect(dashboard.totalAmount).toContainText('70,000');
      await expect(dashboard.totalAmount).toContainText('카테고리 2개');
      // 기간 비교는 도넛 선택과 무관하게 전체 지출 총액
      await expect(dashboard.compareSummary).toContainText('80,000');

      // 모두 해제하면 기본(고정/변동)으로
      await dashboard.donutCategoryButton.click();
      await dashboard.compareCategoryClear.click();
      await dashboard.compareCategoryApply.click();
      await expect(dashboard.categoryDonutItem('고정 지출')).toBeVisible();
      await expect(dashboard.totalAmount).toContainText('80,000');
    });

    test('전체 지출 기간 비교는 총액만 비교하고 카테고리 선택이 없다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedOverview(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();

      await expect(dashboard.trendChart).toContainText('전체 지출');
      await expect(dashboard.trendChart).not.toContainText('식비');
      await expect(dashboard.compareCategoryButton).toHaveCount(0);
    });

    test('고정 지출 탭은 선택이 없으면 전체 고정 지출, 고르면 그 카테고리끼리 비교한다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedOverview(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('고정 지출').click();

      await expect(dashboard.trendChart).toContainText('전체 고정 지출');
      await expect(dashboard.compareSummary).toContainText('30,000');

      await dashboard.compareCategoryButton.click();
      await dashboard.compareCategoryOption('월세').click();
      await dashboard.compareCategoryApply.click();
      await expect(dashboard.trendChart).toContainText('월세');
      await expect(dashboard.trendChart).not.toContainText('전체 고정 지출');
      await expect(dashboard.compareSummary).toContainText('20,000');
    });

    test('전체 수입도 고정/변동 도넛과 총액 비교를 보여준다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedOverview(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabIncome.click();

      await expect(dashboard.categoryDonutItem('고정 수입')).toBeVisible();
      await expect(dashboard.categoryDonutItem('변동 수입')).toBeVisible();
      await expect(dashboard.trendChart).toContainText('전체 수입');
      await expect(dashboard.compareCategoryButton).toHaveCount(0);
    });
  });

  test.describe('기간 비교 차트', () => {
    async function seedMonthlyExpenses(coupleId: string, uid: string) {
      await seedDefaultCategories(coupleId);
      const amounts = [50000, 30000, 10000]; // 이번 달, 1개월 전, 2개월 전
      for (const [offset, amount] of amounts.entries()) {
        await seedCashbookEntry(coupleId, uid, {
          type: 'expense',
          amount,
          category: '식비',
          date: dayjs().subtract(offset, 'month').startOf('month').add(12, 'hour').toISOString(),
        });
      }
    }

    test('기본으로 직전 기간(전월)과 비교한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedMonthlyExpenses(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.periodTabMonthly.click();
      await dashboard.groupTabExpense.click();

      const prevMonth = dayjs().subtract(1, 'month');
      await expect(dashboard.trendChart).toBeVisible({ timeout: 10000 });
      await expect(dashboard.comparePeriodLabel).toHaveText(prevMonth.format('YYYY년 M월'));
      await expect(dashboard.comparePeriodButton).toContainText('전월');
      await expect(dashboard.compareSummary).toContainText('50,000');
      await expect(dashboard.compareSummary).toContainText('30,000');
      await expect(dashboard.compareDelta).toContainText('20,000');
      await expect(dashboard.compareDelta).toContainText('67%');
      // 지출 증가는 경고 이모지
      await expect(dashboard.compareDeltaEmoji).toHaveText(/🚨/);
    });

    test('지출이 줄면 😎, 수입이 줄면 🚨 이모지를 붙인다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const thisMonth = dayjs().startOf('month').add(12, 'hour').toISOString();
      const lastMonth = dayjs().subtract(1, 'month').startOf('month').add(12, 'hour').toISOString();
      const rows: Array<['expense' | 'income', string, number, string]> = [
        ['expense', '식비', 20000, thisMonth],
        ['expense', '식비', 50000, lastMonth],
        ['income', '정기급여', 1000000, thisMonth],
        ['income', '정기급여', 2000000, lastMonth],
      ];
      for (const [type, category, amount, date] of rows) {
        await seedCashbookEntry(coupleId, uid, { type, amount, category, date });
      }

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.periodTabMonthly.click();

      await dashboard.groupTabExpense.click();
      await expect(dashboard.compareDelta).toContainText('30,000');
      await expect(dashboard.compareDeltaEmoji).toHaveText(/😎/);

      await dashboard.groupTabIncome.click();
      await expect(dashboard.compareDelta).toContainText('1,000,000');
      await expect(dashboard.compareDeltaEmoji).toHaveText(/🚨/);
    });

    test('비교할 기간을 직접 선택할 수 있다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedMonthlyExpenses(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.periodTabMonthly.click();
      await dashboard.groupTabExpense.click();

      await dashboard.comparePeriodButton.click();
      await expect(dashboard.comparePickerSheet).toBeVisible();

      const prevMonth = dayjs().subtract(1, 'month');
      const twoMonthsAgo = dayjs().subtract(2, 'month');
      if (twoMonthsAgo.year() !== prevMonth.year()) {
        await dashboard.periodPickerPrev.click();
      }
      await dashboard.periodPickerMonth(twoMonthsAgo.month() + 1).click();

      await expect(dashboard.comparePickerSheet).toBeHidden();
      await expect(dashboard.comparePeriodLabel).toHaveText(twoMonthsAgo.format('YYYY년 M월'));
      await expect(dashboard.comparePeriodButton).not.toContainText('전월');
      await expect(dashboard.compareSummary).toContainText('10,000');
      await expect(dashboard.compareDelta).toContainText('40,000');
    });

    test('요약 합계·증감은 선택한 카테고리 기준으로 계산된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const thisMonth = dayjs().startOf('month').add(12, 'hour').toISOString();
      const lastMonth = dayjs().subtract(1, 'month').startOf('month').add(12, 'hour').toISOString();
      const rows: Array<[string, number, string]> = [
        ['식비', 50000, thisMonth],
        ['교통', 30000, thisMonth],
        ['식비', 20000, lastMonth],
        ['교통', 10000, lastMonth],
      ];
      for (const [category, amount, date] of rows) {
        await seedCashbookEntry(coupleId, uid, { type: 'expense', amount, category, date });
      }

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.periodTabMonthly.click();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      // 선택 없음(기본) = 변동 지출 전체 합계: 80,000 vs 30,000
      await expect(dashboard.compareSummary).toContainText('80,000');
      await expect(dashboard.compareSummary).toContainText('30,000');
      await expect(dashboard.compareDelta).toContainText('50,000');

      // 식비만 고르면: 50,000 vs 20,000
      await dashboard.compareCategoryButton.click();
      await dashboard.compareCategoryOption('식비').click();
      await dashboard.compareCategoryApply.click();
      await expect(dashboard.compareSummary).toContainText('50,000');
      await expect(dashboard.compareSummary).toContainText('20,000');
      await expect(dashboard.compareDelta).toContainText('30,000');
      // 막대 금액 라벨은 만원 단위
      await expect(dashboard.trendChart).toContainText('5만원');
      await expect(dashboard.trendChart).toContainText('2만원');

      // 모두 빼면 다시 전체 합계
      await dashboard.compareCategoryButton.click();
      await dashboard.compareCategoryOption('식비').click();
      await dashboard.compareCategoryApply.click();
      await expect(dashboard.compareSummary).toContainText('80,000');
    });

    test('기준 기간을 이동하면 비교 기간은 다시 직전 기간으로 돌아간다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedMonthlyExpenses(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.periodTabMonthly.click();
      await dashboard.groupTabExpense.click();
      await dashboard.periodPrevButton.click();

      const twoMonthsAgo = dayjs().subtract(2, 'month');
      await expect(dashboard.comparePeriodLabel).toHaveText(twoMonthsAgo.format('YYYY년 M월'));
      await expect(dashboard.compareSummary).toContainText('30,000');
      await expect(dashboard.compareSummary).toContainText('10,000');
    });
  });

  test.describe('기간 비교 — 비교 대상 카테고리 선택', () => {
    // 카테고리 메타 없이 시드해 네 카테고리 모두 변동 지출로 취급되게 한다
    async function seedFourCategories(coupleId: string, uid: string) {
      const today = dayjs().toISOString();
      // 식비 > 교통 > 월세 > 보험 순
      const rows: Array<[string, number]> = [
        ['식비', 50000],
        ['교통', 30000],
        ['월세', 20000],
        ['보험', 10000],
      ];
      for (const [category, amount] of rows) {
        await seedCashbookEntry(coupleId, uid, { type: 'expense', amount, category, date: today });
      }
    }

    test('카테고리를 고르지 않으면 전체 변동 지출 합계로 비교한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFourCategories(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      await expect(dashboard.trendChart).toContainText('전체 변동 지출');
      await expect(dashboard.trendChart).not.toContainText('식비');
      await expect(dashboard.compareSummary).toContainText('110,000');
      await expect(dashboard.compareSummaryCaption).toBeHidden();
    });

    test('바텀시트에서 검색해 카테고리를 추가할 수 있다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFourCategories(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      await dashboard.compareCategoryButton.click();
      await expect(dashboard.compareCategorySheet).toBeVisible();
      await expect(dashboard.compareCategoryOption('식비')).toHaveAttribute(
        'data-state',
        'unselected'
      );

      await dashboard.compareCategorySearch.fill('보험');
      await expect(dashboard.compareCategoryOption('식비')).toBeHidden();
      await dashboard.compareCategoryOption('보험').click();
      await expect(dashboard.compareCategoryOption('보험')).toHaveAttribute(
        'data-state',
        'selected'
      );
      await dashboard.compareCategoryApply.click();

      await expect(dashboard.compareCategorySheet).toBeHidden();
      await expect(dashboard.trendChart).toContainText('보험');
      await expect(dashboard.trendChart).not.toContainText('전체 변동 지출');
      await expect(dashboard.compareSummaryCaption).toContainText('1개');
      await expect(dashboard.compareSummary).toContainText('10,000');
    });

    test('적용하지 않고 시트를 닫으면 선택이 바뀌지 않는다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFourCategories(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      await dashboard.compareCategoryButton.click();
      await dashboard.compareCategoryOption('보험').click();
      await page.keyboard.press('Escape');

      await expect(dashboard.compareCategorySheet).toBeHidden();
      await expect(dashboard.trendChart).not.toContainText('보험');
    });

    test('시트에서 선택을 해제하면 비교 대상에서 빠진다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedFourCategories(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      await dashboard.compareCategoryButton.click();
      await dashboard.compareCategoryOption('식비').click();
      await dashboard.compareCategoryOption('교통').click();
      await dashboard.compareCategoryApply.click();
      await expect(dashboard.trendChart).toContainText('식비');

      await dashboard.compareCategoryButton.click();
      await dashboard.compareCategoryOption('식비').click();
      await dashboard.compareCategoryApply.click();
      await expect(dashboard.trendChart).not.toContainText('식비');
      await expect(dashboard.trendChart).toContainText('교통');

      // 모두 해제하면 다시 전체 합계 비교
      await dashboard.compareCategoryButton.click();
      await dashboard.compareCategoryOption('교통').click();
      await dashboard.compareCategoryApply.click();
      await expect(dashboard.trendChart).toContainText('전체 변동 지출');
    });

    test('비교 기간에만 있는 카테고리도 선택할 수 있다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 50000,
        category: '식비',
        date: dayjs().startOf('month').add(12, 'hour').toISOString(),
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 90000,
        category: '교통',
        date: dayjs().subtract(1, 'month').startOf('month').add(12, 'hour').toISOString(),
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.periodTabMonthly.click();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      await dashboard.compareCategoryButton.click();
      await dashboard.compareCategoryOption('교통').click();
      await dashboard.compareCategoryApply.click();
      await expect(dashboard.trendChart).toContainText('교통');
    });
  });

  test.describe('기간 비교 — 카테고리 선택 시트의 상위/하위 분류', () => {
    async function seedNested(coupleId: string, uid: string) {
      await seedDefaultCategories(coupleId);
      const parentId = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '생활비',
        icon: 'basket',
      });
      for (const name of ['외식', '장보기']) {
        await seedCashbookCategory(coupleId, {
          group: 'expense',
          subGroup: 'variable_common',
          name,
          icon: 'basket',
          parentCategoryId: parentId,
        });
      }
      const today = dayjs().toISOString();
      const rows: Array<[string, number]> = [
        ['외식', 30000],
        ['장보기', 20000],
        ['교통', 10000],
        ['월세', 5000],
      ];
      for (const [category, amount] of rows) {
        await seedCashbookEntry(coupleId, uid, { type: 'expense', amount, category, date: today });
      }
    }

    test('하위 카테고리는 상위 카테고리 아래에 묶여 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedNested(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();
      await dashboard.compareCategoryButton.click();

      const group = dashboard.compareCategoryGroup('생활비');
      await expect(group).toBeVisible();
      await expect(group.getByTestId('compare-category-option-외식')).toBeVisible();
      await expect(group.getByTestId('compare-category-option-장보기')).toBeVisible();
      // 하위가 없는 카테고리는 묶음 없이 단독 항목
      await expect(dashboard.compareCategoryOption('교통')).toBeVisible();
      await expect(dashboard.compareCategoryGroup('교통')).toHaveCount(0);
    });

    test('상위 카테고리를 누르면 하위 전체가 선택/해제된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedNested(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();
      await dashboard.compareCategoryButton.click();

      // 기본은 선택 없음 → 상위를 누르면 하위 전체 선택, 다시 누르면 전체 해제
      const toggle = dashboard.compareCategoryGroupToggle('생활비');
      await expect(toggle).toHaveAttribute('data-state', 'unselected');
      await toggle.click();
      await expect(toggle).toHaveAttribute('data-state', 'selected');
      await expect(dashboard.compareCategoryOption('외식')).toHaveAttribute(
        'data-state',
        'selected'
      );

      await toggle.click();
      await expect(toggle).toHaveAttribute('data-state', 'unselected');
      await expect(dashboard.compareCategoryOption('외식')).toHaveAttribute(
        'data-state',
        'unselected'
      );
      await expect(dashboard.compareCategoryOption('장보기')).toHaveAttribute(
        'data-state',
        'unselected'
      );

      // 하위 하나만 선택하면 상위는 부분 선택
      await dashboard.compareCategoryOption('외식').click();
      await expect(toggle).toHaveAttribute('data-state', 'partial');

      // 부분 선택에서 상위를 누르면 하위 전체 선택
      await toggle.click();
      await expect(toggle).toHaveAttribute('data-state', 'selected');

      await dashboard.compareCategoryApply.click();
      await expect(dashboard.trendChart).toContainText('외식');
      await expect(dashboard.trendChart).toContainText('장보기');
    });

    test('검색해도 상위/하위 구조가 유지된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedNested(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();
      await dashboard.compareCategoryButton.click();

      // 하위 이름으로 검색 → 상위 헤더 + 일치하는 하위만
      await dashboard.compareCategorySearch.fill('외식');
      await expect(dashboard.compareCategoryGroup('생활비')).toBeVisible();
      await expect(dashboard.compareCategoryOption('외식')).toBeVisible();
      await expect(dashboard.compareCategoryOption('장보기')).toBeHidden();
      await expect(dashboard.compareCategoryOption('교통')).toBeHidden();

      // 상위 이름으로 검색 → 하위 전체
      await dashboard.compareCategorySearch.fill('생활');
      await expect(dashboard.compareCategoryOption('외식')).toBeVisible();
      await expect(dashboard.compareCategoryOption('장보기')).toBeVisible();
    });
  });

  test.describe('카테고리 도넛 — 상위 카테고리 합산과 펼치기', () => {
    async function seedNestedEntries(coupleId: string, uid: string) {
      await seedDefaultCategories(coupleId);
      const parentId = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '생활비',
        icon: 'basket',
      });
      for (const name of ['외식', '장보기']) {
        await seedCashbookCategory(coupleId, {
          group: 'expense',
          subGroup: 'variable_common',
          name,
          icon: 'basket',
          parentCategoryId: parentId,
        });
      }
      const today = dayjs().toISOString();
      const rows: Array<[string, number]> = [
        ['외식', 30000],
        ['장보기', 20000],
        ['생활비', 5000],
        ['교통', 10000],
      ];
      for (const [category, amount] of rows) {
        await seedCashbookEntry(coupleId, uid, { type: 'expense', amount, category, date: today });
      }
    }

    test('하위 카테고리는 상위로 합쳐 한 항목으로 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedNestedEntries(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      // 생활비 = 외식 3만 + 장보기 2만 + 생활비 직접 0.5만 = 5.5만
      await expect(dashboard.categoryDonutItem('생활비')).toContainText('5.5만');
      await expect(dashboard.categoryDonutItem('교통')).toBeVisible();
      await expect(dashboard.categoryDonutItem('외식')).toHaveCount(0);
      await expect(dashboard.categoryDonutItem('장보기')).toHaveCount(0);
    });

    test('상위 항목을 누르면 하위 비율로 펼치고 뒤로 돌아올 수 있다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedNestedEntries(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      await dashboard.categoryDonutItem('생활비').getByRole('button').click();
      await expect(dashboard.categoryDonutBack).toContainText('생활비');
      await expect(dashboard.categoryDonutItem('외식')).toContainText('3만');
      await expect(dashboard.categoryDonutItem('장보기')).toContainText('2만');
      // 상위에 직접 기록한 금액은 '(기타)'로 구분
      await expect(dashboard.categoryDonutItem('생활비(기타)')).toContainText('5,000');
      await expect(dashboard.categoryDonutItem('교통')).toHaveCount(0);

      await dashboard.categoryDonutBack.click();
      await expect(dashboard.categoryDonutItem('생활비')).toBeVisible();
      await expect(dashboard.categoryDonutItem('외식')).toHaveCount(0);
    });

    test('하위가 없는 카테고리는 펼칠 수 없다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedNestedEntries(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      await expect(dashboard.categoryDonutItem('교통')).toBeVisible();
      await expect(dashboard.categoryDonutItem('교통').getByRole('button')).toHaveCount(0);
    });
  });
});
