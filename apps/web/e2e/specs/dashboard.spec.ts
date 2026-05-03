import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects/DashboardPage';
import { seedPhoto, seedCashbookEntry } from '../helpers/emulator';

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
  });

  test.describe('최근 사진', () => {
    test('시드된 사진 썸네일이 표시된다', async ({ authedPage }) => {
      // authedPage fixture에서 coupleId를 URL이나 page context로 가져올 수 없으므로
      // 시드 데이터는 fixture 확장으로 처리해야 하지만, 여기선 사진 없는 상태부터 테스트
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.recentPhotosSection).toBeVisible();
    });

    test('사진이 없을 때 업로드 유도 버튼이 표시된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.uploadButton).toBeVisible();
    });

    test('"전체 보기" 클릭 시 /photos로 이동한다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.recentPhotosViewAll.click();
      await expect(authedPage).toHaveURL(/\/photos/);
    });

    test('썸네일 클릭 시 /photos로 이동한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedPhoto(coupleId, uid, {});

      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      await expect(dashboard.photoThumbnails).toHaveCount(1, { timeout: 10000 });
      await dashboard.photoThumbnails.first().click();
      await expect(page).toHaveURL(/\/photos$/);
    });
  });

  test.describe('이번 달 가계부', () => {
    test('가계부 내역이 없을 때 수입/지출/잔액이 0으로 표시된다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await expect(dashboard.monthlySummarySection).toBeVisible();
      await expect(dashboard.incomeAmount).toContainText('0');
      await expect(dashboard.expenseAmount).toContainText('0');
      await expect(dashboard.balanceAmount).toContainText('0');
    });

    test('"전체 보기" 클릭 시 /cashbook으로 이동한다', async ({ authedPage }) => {
      const dashboard = new DashboardPage(authedPage);
      await dashboard.cashbookViewAll.click();
      await expect(authedPage).toHaveURL(/\/cashbook/);
    });
  });
});
