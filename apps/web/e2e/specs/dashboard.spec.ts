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

    test('기본(이번 달) 기간이 내역 페이지에 그대로 적용된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.groupTabExpense.click();
      await dashboard.totalAmount.click();
      await expect(authedPage).toHaveURL(/\/inner\/cashbook\/history/, { timeout: 30000 });

      await expect(authedPage.getByTestId('cashbook-period-label')).toHaveText(
        `${dayjs().month() + 1}월`
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
    test('기본값으로 월간 + 전체 탭이 활성화된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.periodSelector).toBeVisible();
      await expect(dashboard.groupTabs).toBeVisible();
      await expect(dashboard.periodTabMonthly).toHaveAttribute('data-state', 'active');
      await expect(dashboard.groupTabAll).toHaveAttribute('data-state', 'active');
    });

    test('기간 탭은 월간·연간만 있고 주간 탭은 없다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.periodSelector.getByRole('tab')).toHaveText(['월간', '연간']);
    });

    test('예전 주간 URL로 들어오면 월간으로 보여준다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await authedPage.goto('/inner/cashbook?period=weekly');
      await expect(dashboard.periodTabMonthly).toHaveAttribute('data-state', 'active');
      await expect(dashboard.periodNavLabel).toContainText(dayjs().format('YYYY년 M월'));
    });

    test('기간 네비게이터에 현재 월 라벨이 표시된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.periodNavLabel).toContainText(dayjs().format('YYYY년 M월'));
    });

    test('우측 화살표는 현재 기간일 때 비활성화된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.periodNextButton).toBeDisabled();
    });

    test('좌측 화살표 클릭 시 이전 달로 이동하고 우측 화살표가 활성화된다', async ({
      authedPage,
    }) => {
      const dashboard = new DashboardPage(authedPage);

      await dashboard.periodPrevButton.click();

      const prevMonth = dayjs().subtract(1, 'month');
      await expect(dashboard.periodNavLabel).toContainText(prevMonth.format('YYYY년 M월'));
      await expect(dashboard.periodNextButton).toBeEnabled();
    });

    test('연간 탭에서 월간 탭으로 돌아오면 라벨이 월 단위로 바뀐다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabYearly.click();
      await expect(dashboard.periodNavLabel).toHaveText(`${dayjs().year()}년`);
      await dashboard.periodTabMonthly.click();

      await expect(dashboard.periodNavLabel).toHaveText(/^\d{4}년 \d{1,2}월$/);
    });

    test('연간 탭 선택 시 라벨이 연도로 바뀐다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabYearly.click();

      const expected = `${dayjs().year()}년`;
      await expect(dashboard.periodNavLabel).toContainText(expected);
    });
  });

  test.describe('가계부 대시보드 — 월간/연간 탭별 기간 유지', () => {
    test('탭을 오가도 각 탭에서 보던 기간이 그대로 남는다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      const month = dayjs().subtract(2, 'month');
      const year = dayjs().year() - 1;

      await dashboard.periodPrevButton.click();
      await dashboard.periodPrevButton.click();
      await expect(dashboard.periodNavLabel).toHaveText(month.format('YYYY년 M월'));

      await dashboard.periodTabYearly.click();
      await dashboard.periodPrevButton.click();
      await expect(dashboard.periodNavLabel).toHaveText(`${year}년`);

      for (let round = 0; round < 2; round++) {
        await dashboard.periodTabMonthly.click();
        await expect(dashboard.periodNavLabel).toHaveText(month.format('YYYY년 M월'));
        await dashboard.periodTabYearly.click();
        await expect(dashboard.periodNavLabel).toHaveText(`${year}년`);
      }
    });

    test('연간 탭을 처음 열면 월간에서 보던 달의 연도로 열린다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      const lastYear = dayjs().year() - 1;
      await dashboard.periodNavLabel.click();
      await dashboard.periodPickerPrev.click();
      await dashboard.periodPickerMonth(3).click();
      await expect(dashboard.periodNavLabel).toHaveText(`${lastYear}년 3월`);

      await dashboard.periodTabYearly.click();
      await expect(dashboard.periodNavLabel).toHaveText(`${lastYear}년`);
    });

    test('다른 페이지에 다녀와도 탭별 기간이 유지된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      const month = dayjs().subtract(1, 'month');
      const year = dayjs().year() - 2;

      await dashboard.periodPrevButton.click();
      await dashboard.periodTabYearly.click();
      await dashboard.periodPrevButton.click();
      await dashboard.periodPrevButton.click();
      await expect(dashboard.periodNavLabel).toHaveText(`${year}년`);

      await authedPage.getByTestId('dashboard-history-link').click();
      await expect(authedPage).toHaveURL(/\/inner\/cashbook\/history/, { timeout: 30000 });
      await authedPage.goBack();

      await expect(dashboard.periodTabYearly).toHaveAttribute('data-state', 'active');
      await expect(dashboard.periodNavLabel).toHaveText(`${year}년`);
      await dashboard.periodTabMonthly.click();
      await expect(dashboard.periodNavLabel).toHaveText(month.format('YYYY년 M월'));
    });
  });

  test.describe('가계부 대시보드 — 필터 유지 (URL)', () => {
    test('필터를 바꾸면 URL 쿼리에 저장된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabMonthly.click();
      await dashboard.periodPrevButton.click();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('고정 지출').click();

      const prevMonth = dayjs().subtract(1, 'month').startOf('month');
      // 월간은 기본값이라 period는 생략된다
      await expect(authedPage).not.toHaveURL(/period=/);
      await expect(authedPage).toHaveURL(new RegExp(`at=${prevMonth.format('YYYY-MM-DD')}`));
      await expect(authedPage).toHaveURL(/group=expense/);
      await expect(authedPage).toHaveURL(/sub=fixed/);
    });

    test('다른 페이지에 다녀와도(뒤로 가기) 필터가 유지된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabMonthly.click();
      await dashboard.periodPrevButton.click();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('고정 지출').click();
      await expect(authedPage).toHaveURL(/sub=fixed/);

      await dashboard.totalAmount.click();
      await expect(authedPage).toHaveURL(/\/inner\/cashbook\/history/, { timeout: 30000 });
      await authedPage.goBack();

      const prevMonth = dayjs().subtract(1, 'month');
      await expect(dashboard.periodTabMonthly).toHaveAttribute('data-state', 'active');
      await expect(dashboard.periodNavLabel).toContainText(prevMonth.format('YYYY년 M월'));
      await expect(dashboard.groupTabExpense).toHaveAttribute('data-state', 'active');
      await expect(dashboard.subGroupTab('고정 지출')).toHaveAttribute('data-state', 'active');
    });

    test('필터를 연달아 바꾼 뒤 다녀와도 마지막 필터가 유지된다 (반복)', async ({ authedPage }) => {
      // 필터 변경마다 라우터 내비게이션을 하면 서로 경합해 히스토리에 중간 상태가 남던 회귀 방지
      const dashboard = new DashboardPage(authedPage);
      for (let round = 0; round < 4; round++) {
        await dashboard.periodTabYearly.click();
        await dashboard.groupTabExpense.click();
        await expect(authedPage).toHaveURL(/group=expense/);

        await authedPage.getByTestId('dashboard-history-link').click();
        await expect(authedPage).toHaveURL(/\/inner\/cashbook\/history/, { timeout: 30000 });
        await authedPage.goBack();

        await expect(authedPage).toHaveURL(/period=yearly&group=expense/);
        await expect(dashboard.periodTabYearly).toHaveAttribute('data-state', 'active');
        await expect(dashboard.groupTabExpense).toHaveAttribute('data-state', 'active');

        await dashboard.periodTabMonthly.click();
        await dashboard.groupTabAll.click();
        await expect(authedPage).not.toHaveURL(/group=|period=/);
      }
    });

    test('필터가 담긴 URL로 바로 들어오면 그 필터로 보여준다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await authedPage.goto('/inner/cashbook?period=yearly&group=income');

      await expect(dashboard.periodTabYearly).toHaveAttribute('data-state', 'active');
      await expect(dashboard.periodNavLabel).toContainText(`${dayjs().year()}년`);
      await expect(dashboard.groupTabIncome).toHaveAttribute('data-state', 'active');
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

    test('전체 탭은 수입 대비 지출 게이지만 보여준다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const today = dayjs().toISOString();
      const rows: Array<['expense' | 'income', string, number]> = [
        ['expense', '식비', 300000],
        ['income', '정기급여', 1000000],
      ];
      for (const [type, category, amount] of rows) {
        await seedCashbookEntry(coupleId, uid, { type, amount, category, date: today });
      }

      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      await expect(dashboard.groupTabAll).toHaveAttribute('data-state', 'active');
      await expect(dashboard.meterPercent).toHaveText('30%');
      await expect(dashboard.meterIncome).toContainText('1,000,000');
      await expect(dashboard.meterExpense).toContainText('300,000');
      await expect(dashboard.meterStatus).toContainText('남은 금액');
      await expect(dashboard.meterStatus).toContainText('700,000');
      await expect(dashboard.categoryDonut).toBeHidden();
      // 합계 카드·고정/변동 필터·기간 비교는 전체 탭에서 숨김
      await expect(dashboard.totalAmount).toBeHidden();
      await expect(dashboard.subGroupTabs).toBeHidden();
      await expect(dashboard.periodCompare).toBeHidden();
    });

    test('지출이 수입을 넘기면 초과 금액을 알린다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const today = dayjs().toISOString();
      await seedCashbookEntry(coupleId, uid, {
        type: 'income',
        amount: 200000,
        category: '정기급여',
        date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 300000,
        category: '식비',
        date: today,
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      await expect(dashboard.meterPercent).toHaveText('150%');
      await expect(dashboard.meterStatus).toContainText('🚨');
      await expect(dashboard.meterStatus).toContainText('100,000');
      await expect(dashboard.meterStatus).toContainText('더 썼어요');
    });

    test('수입이 없으면 수입이 없다고 알린다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 50000,
        category: '식비',
        date: dayjs().toISOString(),
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      await expect(dashboard.meterPercent).toHaveText('—');
      await expect(dashboard.meterStatus).toContainText('수입이 없어요');
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

  test.describe('카테고리 색상', () => {
    test('도넛 범례는 카테고리에 지정된 색을 그대로 쓴다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '식비',
        icon: 'bowl_food',
        color: '#E5B53E',
      });
      await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_personal',
        name: '교통',
        icon: 'bus',
        color: '#6A6FD8',
      });
      const today = dayjs().toISOString();
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 30000,
        category: '식비',
        date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 10000,
        category: '교통',
        date: today,
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      await expect(page.getByTestId('category-donut-swatch-식비')).toHaveCSS(
        'background-color',
        'rgb(229, 181, 62)'
      );
      await expect(page.getByTestId('category-donut-swatch-교통')).toHaveCSS(
        'background-color',
        'rgb(106, 111, 216)'
      );
    });

    test('같은 색 카테고리끼리는 같은 계열의 다른 명도로 구분한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      for (const name of ['식비', '교통']) {
        await seedCashbookCategory(coupleId, {
          group: 'expense',
          subGroup: 'variable_common',
          name,
          icon: 'bowl_food',
          color: '#6A6FD8',
        });
      }
      const today = dayjs().toISOString();
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 30000,
        category: '식비',
        date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 10000,
        category: '교통',
        date: today,
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();

      // 금액이 큰 식비가 원색, 교통은 같은 계열의 밝은 색
      await expect(page.getByTestId('category-donut-swatch-식비')).toHaveCSS(
        'background-color',
        'rgb(106, 111, 216)'
      );
      await expect(page.getByTestId('category-donut-swatch-교통')).not.toHaveCSS(
        'background-color',
        'rgb(106, 111, 216)'
      );
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

    test('지출 탭에서는 보이고 전체 탭에서는 고정/변동 필터가 보이지 않는다', async ({
      authedPage,
    }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.subGroupTabs).toBeHidden();
      await dashboard.groupTabExpense.click();
      await expect(dashboard.subGroupTabs).toBeVisible();
      await dashboard.groupTabAll.click();
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
        icon: 'shopping_bag',
      });
      for (const name of ['외식', '장보기']) {
        await seedCashbookCategory(coupleId, {
          group: 'expense',
          subGroup: 'variable_common',
          name,
          icon: 'shopping_bag',
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

    test('카테고리는 가나다 순으로 정렬되고 색 점 대신 아이콘으로 표시된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedNested(coupleId, uid);

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();
      await dashboard.subGroupTab('변동 지출').click();
      await dashboard.compareCategoryButton.click();

      // 금액순(생활비 50,000 > 교통 10,000)이 아니라 가나다 순
      const rows = await page
        .getByTestId('compare-category-list')
        .locator(
          '[data-testid^="compare-category-option-"], [data-testid^="compare-category-group-toggle-"]'
        )
        .allInnerTexts();
      expect(rows.map((r) => r.trim())).toEqual(['교통', '생활비', '외식', '장보기']);

      await expect(page.getByTestId('compare-category-icon-교통')).toBeVisible();
      await expect(page.getByTestId('compare-category-icon-생활비')).toBeVisible();
      await expect(page.getByTestId('compare-category-icon-외식')).toBeVisible();
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

  test.describe('월 중위값 비교 카드', () => {
    /** offset개월 전 달의 1일 정오로 지출 내역을 시드한다 (0 = 이번 달) */
    async function seedMonth(
      coupleId: string,
      uid: string,
      offset: number,
      rows: Array<[string, number]>,
      type: 'expense' | 'income' = 'expense'
    ) {
      const date = dayjs().subtract(offset, 'month').startOf('month').add(12, 'hour').toISOString();
      for (const [category, amount] of rows) {
        await seedCashbookEntry(coupleId, uid, { type, amount, category, date });
      }
    }

    async function openExpenseMonthly(page: DashboardPage['page']) {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.periodTabMonthly.click();
      await dashboard.groupTabExpense.click();
      return dashboard;
    }

    test('이번 달 합계를 최근 6개월 중위값과 비교하고 많이 쓴 카테고리를 알려준다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      // 식비: 4개월 전부터 30k, 40k, 50k, 60k → 중위값 45,000
      const previous = [60000, 50000, 40000, 30000];
      for (const [i, amount] of previous.entries()) {
        await seedMonth(coupleId, uid, i + 1, [['식비', amount]]);
      }
      await seedMonth(coupleId, uid, 0, [['식비', 100000]]);

      const dashboard = await openExpenseMonthly(page);
      await expect(dashboard.medianCompare).toBeVisible({ timeout: 10000 });
      await expect(dashboard.medianCompareCaption).toHaveText('최근 6개월 중위값');

      await expect(dashboard.medianCompareSummary).toContainText('100,000');
      await expect(dashboard.medianCompareSummary).toContainText('45,000');
      await expect(dashboard.medianCompareDelta).toContainText('55,000');
      await expect(dashboard.medianCompareDelta).toContainText('122%');
      await expect(dashboard.medianCompareDelta).toContainText('많이 썼어요');
      await expect(dashboard.medianCompareDeltaEmoji).toHaveText(/🚨/);

      const food = dashboard.medianHighlight('식비');
      await expect(food).toBeVisible();
      await expect(food).toHaveAttribute('data-kind', 'high');
      await expect(food).toContainText('100,000');
      await expect(food).toContainText('평소 45,000원');
    });

    test('적게 쓴 카테고리·이번 달 없는 항목·처음 나온 항목을 구분해 알려준다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      for (const offset of [1, 2, 3]) {
        await seedMonth(coupleId, uid, offset, [
          ['월세', 700000],
          ['교통', 50000],
          ['식비', 30000],
        ]);
      }
      await seedMonth(coupleId, uid, 0, [
        ['교통', 10000],
        ['식비', 30000],
        ['데이트', 20000],
      ]);

      const dashboard = await openExpenseMonthly(page);
      await expect(dashboard.medianCompare).toBeVisible({ timeout: 10000 });

      // 합계: 60,000 vs 중위값 780,000 → 720,000 적게 (92%)
      await expect(dashboard.medianCompareDelta).toContainText('720,000');
      await expect(dashboard.medianCompareDelta).toContainText('92%');
      await expect(dashboard.medianCompareDelta).toContainText('적게 썼어요');
      await expect(dashboard.medianCompareDeltaEmoji).toHaveText(/😎/);

      const transport = dashboard.medianHighlight('교통');
      await expect(transport).toHaveAttribute('data-kind', 'low');
      await expect(transport).toContainText('평소 50,000원');

      const rent = dashboard.medianHighlight('월세');
      await expect(rent).toHaveAttribute('data-kind', 'missing');
      await expect(rent).toContainText('0원');
      await expect(rent).toContainText('평소 700,000원');

      const date = dashboard.medianHighlight('데이트');
      await expect(date).toHaveAttribute('data-kind', 'new');
      await expect(date).toContainText('평소엔 없음');

      // 평소와 같은 카테고리는 목록에 없다
      await expect(dashboard.medianHighlight('식비')).toHaveCount(0);
      // 차이가 큰 순서: 월세 → 교통 → 데이트
      await expect(dashboard.medianCompareHighlights.locator('[data-kind]')).toHaveCount(3);
      await expect(dashboard.medianCompareHighlights.locator('[data-kind]').first()).toContainText(
        '월세'
      );
    });

    test('평소와 비슷하면 눈에 띄는 카테고리가 없다고 알려준다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      await seedMonth(coupleId, uid, 1, [['식비', 50000]]);
      await seedMonth(coupleId, uid, 2, [['식비', 50000]]);
      await seedMonth(coupleId, uid, 0, [['식비', 52000]]);

      const dashboard = await openExpenseMonthly(page);
      await expect(dashboard.medianCompare).toBeVisible({ timeout: 10000 });
      await expect(dashboard.medianCompareDelta).toContainText('2,000');
      await expect(dashboard.medianCompareNone).toBeVisible();
      await expect(dashboard.medianHighlight('식비')).toHaveCount(0);
    });

    test('지난달 기록이 2개월 미만이면 비교하지 않고 안내만 보여준다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      await seedMonth(coupleId, uid, 1, [['식비', 30000]]);
      await seedMonth(coupleId, uid, 0, [['식비', 50000]]);

      const dashboard = await openExpenseMonthly(page);
      await expect(dashboard.medianCompare).toBeVisible({ timeout: 10000 });
      await expect(dashboard.medianCompareEmpty).toBeVisible();
      await expect(dashboard.medianCompareSummary).toHaveCount(0);
    });

    test('연간 탭과 전체 탭에서는 보이지 않는다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      await seedMonth(coupleId, uid, 1, [['식비', 30000]]);
      await seedMonth(coupleId, uid, 2, [['식비', 30000]]);
      await seedMonth(coupleId, uid, 0, [['식비', 50000]]);

      const dashboard = await openExpenseMonthly(page);
      await expect(dashboard.medianCompare).toBeVisible({ timeout: 10000 });

      await dashboard.periodTabYearly.click();
      await expect(dashboard.trendChart).toBeVisible();
      await expect(dashboard.medianCompare).toHaveCount(0);

      await dashboard.periodTabMonthly.click();
      await dashboard.groupTabAll.click();
      await expect(dashboard.meterPercent).toBeVisible();
      await expect(dashboard.medianCompare).toHaveCount(0);
    });

    test('고정/변동 세부 탭을 고르면 그 세부 그룹만 비교한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      for (const offset of [1, 2]) {
        await seedMonth(coupleId, uid, offset, [
          ['월세', 700000],
          ['식비', 30000],
        ]);
      }
      await seedMonth(coupleId, uid, 0, [
        ['월세', 700000],
        ['식비', 100000],
      ]);

      const dashboard = await openExpenseMonthly(page);
      await expect(dashboard.medianCompareSummary).toContainText('800,000', { timeout: 10000 });
      await expect(dashboard.medianCompareSummary).toContainText('730,000');

      await dashboard.subGroupTab('변동 지출').click();
      await expect(dashboard.medianCompareSummary).toContainText('100,000');
      await expect(dashboard.medianCompareSummary).toContainText('30,000');
      await expect(dashboard.medianCompareSummary).not.toContainText('730,000');
    });

    test('수입 탭에서는 수입 기준 문구와 색으로 보여준다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      await seedMonth(coupleId, uid, 1, [['정기급여', 3000000]], 'income');
      await seedMonth(coupleId, uid, 2, [['정기급여', 3000000]], 'income');
      await seedMonth(coupleId, uid, 0, [['정기급여', 1000000]], 'income');

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.periodTabMonthly.click();
      await dashboard.groupTabIncome.click();

      // 1,000,000 vs 중위값 3,000,000 → 2,000,000 적게 (67%)
      await expect(dashboard.medianCompareDelta).toContainText('2,000,000', { timeout: 10000 });
      await expect(dashboard.medianCompareDelta).toContainText('67%');
      await expect(dashboard.medianCompareDelta).toContainText('적게 들어왔어요');
      await expect(dashboard.medianCompareDeltaEmoji).toHaveText(/🚨/);
      await expect(dashboard.medianHighlight('정기급여')).toHaveAttribute('data-kind', 'low');
    });

    test('눈에 띄는 카테고리는 차이가 큰 순으로 4개까지만 보여준다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const names = ['식비', '교통', '여행', '소비', '월세', '보험'];
      for (const offset of [1, 2]) {
        await seedMonth(
          coupleId,
          uid,
          offset,
          names.map((name) => [name, 10000])
        );
      }
      // 식비가 가장 적게, 보험이 가장 많이 늘었다
      await seedMonth(
        coupleId,
        uid,
        0,
        names.map((name, i) => [name, 100000 + i * 1000])
      );

      const dashboard = await openExpenseMonthly(page);
      await expect(dashboard.medianCompareHighlights).toBeVisible({ timeout: 10000 });
      await expect(dashboard.medianCompareHighlights.locator('[data-kind]')).toHaveCount(4);
      await expect(dashboard.medianCompareHighlights.locator('[data-kind]').first()).toContainText(
        '보험'
      );
      // 차이가 가장 작은 둘은 잘린다
      await expect(dashboard.medianHighlight('식비')).toHaveCount(0);
      await expect(dashboard.medianHighlight('교통')).toHaveCount(0);
    });
  });
});
