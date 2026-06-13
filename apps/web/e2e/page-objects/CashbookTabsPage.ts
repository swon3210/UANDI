import { type Page, type Locator } from '@playwright/test';

/**
 * 가계부 상단 탭 + 설정(⚙) POM. 가계부 루트(`/inner/cashbook`)는 요약(대시보드)이고,
 * 상단 탭 4개(내역/캘린더/결산/계획)로 드릴다운한다.
 */
export class CashbookTabsPage {
  readonly page: Page;
  readonly summaryHeader: Locator;
  readonly tabs: Locator;
  readonly tabHistory: Locator;
  readonly tabCashflow: Locator;
  readonly tabSettlement: Locator;
  readonly tabPlan: Locator;

  // 제거 검증용(이전 ⋮ 더보기 메뉴)
  readonly legacyMoreMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.summaryHeader = page.getByTestId('dashboard-header');
    this.tabs = page.getByTestId('cashbook-tabs');
    this.tabHistory = page.getByTestId('cashbook-tab-history');
    this.tabCashflow = page.getByTestId('cashbook-tab-cashflow');
    this.tabSettlement = page.getByTestId('cashbook-tab-settlement');
    this.tabPlan = page.getByTestId('cashbook-tab-plan');
    this.legacyMoreMenu = page.getByTestId('cashbook-more-menu');
  }

  async goto() {
    await this.page.goto('/inner/cashbook');
  }
}
