import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { CashbookTabsPage } from '../page-objects/CashbookTabsPage';

/**
 * Phase 2 — 가계부 ⋮ 해체 → 상단 탭 + ⚙ 설정.
 * 가계부 진입(랜딩) = 요약(대시보드), 상단 탭 4개 = 내역/캘린더/결산/계획.
 */
test.describe('가계부 상단 탭 (CashbookTabs)', () => {
  test('가계부 진입 시 요약(대시보드)이 기본 화면이고 상단 탭 4개가 표시된다', async ({
    authedPage,
  }) => {
    const cb = new CashbookTabsPage(authedPage);
    await cb.goto();
    await expect(cb.summaryHeader).toBeVisible(); // 요약 = 대시보드
    await expect(cb.tabs).toBeVisible();
    await expect(cb.tabHistory).toBeVisible();
    await expect(cb.tabCashflow).toBeVisible();
    await expect(cb.tabSettlement).toBeVisible();
    await expect(cb.tabPlan).toBeVisible();
  });

  test('요약 루트에서는 어떤 상단 탭도 활성화되지 않는다', async ({ authedPage }) => {
    const cb = new CashbookTabsPage(authedPage);
    await cb.goto();
    await expect(cb.tabs).toBeVisible();
    await expect(cb.tabHistory).not.toHaveAttribute('aria-current', 'page');
    await expect(cb.tabCashflow).not.toHaveAttribute('aria-current', 'page');
    await expect(cb.tabSettlement).not.toHaveAttribute('aria-current', 'page');
    await expect(cb.tabPlan).not.toHaveAttribute('aria-current', 'page');
  });

  test('각 상단 탭을 누르면 해당 화면으로 이동하고 그 탭이 활성화된다', async ({ authedPage }) => {
    const cb = new CashbookTabsPage(authedPage);
    await cb.goto();

    await cb.tabHistory.click();
    await authedPage.waitForURL(/\/inner\/cashbook\/history$/, { timeout: 60000 });
    await expect(cb.tabHistory).toHaveAttribute('aria-current', 'page');

    await cb.tabCashflow.click();
    await authedPage.waitForURL(/\/inner\/cashbook\/cashflow$/, { timeout: 60000 });
    await expect(cb.tabCashflow).toHaveAttribute('aria-current', 'page');

    await cb.tabSettlement.click();
    await authedPage.waitForURL(/\/inner\/cashbook\/settlement$/, { timeout: 60000 });
    await expect(cb.tabSettlement).toHaveAttribute('aria-current', 'page');

    await cb.tabPlan.click();
    await authedPage.waitForURL(/\/inner\/cashbook\/plan\/annual$/, { timeout: 60000 });
    await expect(cb.tabPlan).toHaveAttribute('aria-current', 'page');
  });

  test('가계부 ⋮ 더보기 드롭다운이 더 이상 존재하지 않는다', async ({ authedPage }) => {
    const cb = new CashbookTabsPage(authedPage);
    await cb.goto();
    await expect(cb.legacyMoreMenu).toHaveCount(0);
  });

  test('탭 줄에 ⚙ 설정 버튼이 없다(전역 설정 허브로 이동)', async ({ authedPage }) => {
    const cb = new CashbookTabsPage(authedPage);
    await cb.goto();
    await expect(cb.tabs).toBeVisible();
    await expect(authedPage.getByTestId('cashbook-settings')).toHaveCount(0);
  });

  test('프로필 → 설정 → 가계부 설정에서 카테고리·알림에 접근한다', async ({ authedPage }) => {
    await authedPage.goto('/inner/cashbook');
    await authedPage.getByTestId('profile-menu-trigger').click();
    await authedPage.getByTestId('menu-settings').click();
    await authedPage.waitForURL(/\/settings$/, { timeout: 60000 });
    await authedPage.getByTestId('settings-cashbook').click();
    await authedPage.waitForURL(/\/inner\/cashbook\/settings$/, { timeout: 60000 });
    await expect(authedPage.getByTestId('settings-link-categories')).toBeVisible();
    await expect(authedPage.getByTestId('settings-link-notifications')).toBeVisible();
  });
});
