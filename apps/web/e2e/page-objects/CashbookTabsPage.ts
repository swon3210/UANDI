import { type Page, type Locator } from '@playwright/test';

/**
 * 가계부 상단 탭 + 설정(⚙) POM. 가계부 루트(`/inner/cashbook`)는 대시보드이고,
 * 상단 탭 4개(대시보드/내역/현금흐름/목표)로 전환한다. 점검은 탭이 아니라
 * 대시보드 헤더·내역 페이지의 진입점으로 들어간다.
 */
export class CashbookTabsPage {
  readonly page: Page;
  readonly summaryHeader: Locator;
  readonly tabs: Locator;
  readonly tabDashboard: Locator;
  readonly tabHistory: Locator;
  readonly tabCashflow: Locator;
  readonly tabPlan: Locator;

  // 제거 검증용(이전 ⋮ 더보기 메뉴)
  readonly legacyMoreMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.summaryHeader = page.getByTestId('dashboard-header');
    this.tabs = page.getByTestId('cashbook-tabs');
    this.tabDashboard = page.getByTestId('cashbook-tab-dashboard');
    this.tabHistory = page.getByTestId('cashbook-tab-history');
    this.tabCashflow = page.getByTestId('cashbook-tab-cashflow');
    this.tabPlan = page.getByTestId('cashbook-tab-plan');
    this.legacyMoreMenu = page.getByTestId('cashbook-more-menu');
  }

  async goto() {
    await this.page.goto('/inner/cashbook');
  }
}
