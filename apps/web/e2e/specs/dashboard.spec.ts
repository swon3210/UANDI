import { expect } from '@playwright/test';
import dayjs from 'dayjs';
import { test } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects/DashboardPage';
import { seedCashbookEntry, seedDefaultCategories } from '../helpers/emulator';

test.describe('대시보드', () => {
  test.describe('레이아웃', () => {
    test('로그인 후 대시보드에 Header가 표시된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.header).toBeVisible();
    });

    test('모바일에서 BottomNav가 표시된다', async ({ authedPage }, testInfo) => {
      test.skip(testInfo.project.name === 'chromium', 'BottomNav는 모바일 전용');
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.bottomNav).toBeVisible();
    });

    test('최근 사진 영역과 이번 달 가계부 요약 영역은 더 이상 표시되지 않는다', async ({
      authedPage,
    }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.recentPhotosSection).toHaveCount(0);
      await expect(dashboard.monthlySummarySection).toHaveCount(0);
    });
  });

  test.describe('진입 버튼', () => {
    test('사진 갤러리와 가계부 진입 버튼이 모두 표시된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.photoGalleryEntry).toBeVisible();
      await expect(dashboard.photoGalleryEntry).toContainText('사진 갤러리');
      await expect(dashboard.cashbookEntry).toBeVisible();
      await expect(dashboard.cashbookEntry).toContainText('가계부');
    });

    test('사진 갤러리 버튼 클릭 시 /photos로 이동한다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.photoGalleryEntry.click();
      await expect(authedPage).toHaveURL(/\/photos/, { timeout: 30000 });
    });

    test('가계부 버튼 클릭 시 /cashbook으로 이동한다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.cashbookEntry.click();
      await expect(authedPage).toHaveURL(/\/cashbook/, { timeout: 30000 });
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

    test('기간 네비게이터에 현재 월 라벨이 표시된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      const expected = dayjs().format('YYYY년 M월');
      await expect(dashboard.periodNavLabel).toContainText(expected);
    });

    test('우측 화살표는 현재 기간일 때 비활성화된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.periodNextButton).toBeDisabled();
    });

    test('좌측 화살표 클릭 시 이전 월로 이동하고 우측 화살표가 활성화된다', async ({
      authedPage,
    }) => {
      const dashboard = new DashboardPage(authedPage);
      const prevMonthLabel = dayjs().subtract(1, 'month').format('YYYY년 M월');

      await dashboard.periodPrevButton.click();

      await expect(dashboard.periodNavLabel).toContainText(prevMonthLabel);
      await expect(dashboard.periodNextButton).toBeEnabled();
    });

    test('주간 탭 선택 시 라벨이 주 단위로 바뀐다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabWeekly.click();

      // weekly 라벨은 'M월 D일 ~ D일' 패턴
      await expect(dashboard.periodNavLabel).toContainText(/\d+월 \d+일\s*~\s*\d+일/);
    });

    test('연간 탭 선택 시 라벨이 연도로 바뀐다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.periodTabYearly.click();

      const expected = `${dayjs().year()}년`;
      await expect(dashboard.periodNavLabel).toContainText(expected);
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

      await expect(dashboard.trendChart).toBeVisible({ timeout: 10000 });
      await expect(dashboard.categoryDonut).toBeVisible();
      // 합계 KPI: 전체 = 수입(1,000,000) - 지출(20,000) = 980,000
      await expect(dashboard.totalAmount).toContainText('980,000');
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

      await expect(dashboard.categoryDonut).toContainText('식비');
      await expect(dashboard.categoryDonut).not.toContainText('정기급여');
      await expect(dashboard.totalAmount).toContainText('12,000');
    });
  });

  test.describe('카테고리 비교 선택기', () => {
    test('데이터가 있을 때 카테고리 칩 선택기가 표시되고 상위 3개가 자동 선택된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const today = dayjs().toISOString();
      // 4개 카테고리에 서로 다른 금액 시드 (식비 > 교통 > 쇼핑 > 의료 순)
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense', amount: 50000, category: '식비', date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense', amount: 30000, category: '교통', date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense', amount: 20000, category: '월세', date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense', amount: 10000, category: '보험', date: today,
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();

      await expect(dashboard.categorySelector).toBeVisible();
      // 상위 3개(식비, 교통, 월세)가 자동 선택, 4번째(보험)는 미선택
      await expect(dashboard.categoryChip('식비')).toHaveAttribute('data-state', 'selected');
      await expect(dashboard.categoryChip('교통')).toHaveAttribute('data-state', 'selected');
      await expect(dashboard.categoryChip('월세')).toHaveAttribute('data-state', 'selected');
      await expect(dashboard.categoryChip('보험')).toHaveAttribute('data-state', 'unselected');
    });

    test('칩을 토글하면 선택 상태가 바뀐다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const today = dayjs().toISOString();
      // 4개 시드 → 상위 3개(식비/교통/월세)만 자동 선택, 보험은 미선택
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense', amount: 50000, category: '식비', date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense', amount: 30000, category: '교통', date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense', amount: 20000, category: '월세', date: today,
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense', amount: 10000, category: '보험', date: today,
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.groupTabExpense.click();

      // 보험은 기본 미선택 → 클릭하면 선택됨
      const insurance = dashboard.categoryChip('보험');
      await expect(insurance).toHaveAttribute('data-state', 'unselected');
      await insurance.click();
      await expect(insurance).toHaveAttribute('data-state', 'selected');

      // 식비는 기본 선택 → 클릭하면 해제됨
      const food = dashboard.categoryChip('식비');
      await expect(food).toHaveAttribute('data-state', 'selected');
      await food.click();
      await expect(food).toHaveAttribute('data-state', 'unselected');
    });
  });
});
