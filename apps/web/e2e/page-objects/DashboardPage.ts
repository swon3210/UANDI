import { type Page, type Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly header: Locator;
  readonly bottomNav: Locator;

  // 진입 버튼
  readonly photoGalleryEntry: Locator;
  readonly cashbookEntry: Locator;

  // 가계부 대시보드
  readonly periodSelector: Locator;
  readonly periodTabWeekly: Locator;
  readonly periodTabMonthly: Locator;
  readonly periodTabYearly: Locator;

  readonly periodNavigator: Locator;
  readonly periodNavLabel: Locator;
  readonly periodPrevButton: Locator;
  readonly periodNextButton: Locator;

  readonly groupTabs: Locator;
  readonly groupTabAll: Locator;
  readonly groupTabIncome: Locator;
  readonly groupTabExpense: Locator;
  readonly groupTabFlex: Locator;
  readonly groupTabInvestment: Locator;

  readonly totalAmount: Locator;
  readonly trendChart: Locator;
  readonly categoryDonut: Locator;
  readonly emptyState: Locator;
  readonly categorySelector: Locator;

  categoryChip(name: string): Locator {
    return this.page.getByTestId(`category-chip-${name}`);
  }

  // 제거된 영역 검증용
  readonly recentPhotosSection: Locator;
  readonly monthlySummarySection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('dashboard-header');
    this.bottomNav = page.getByTestId('bottom-nav');

    this.photoGalleryEntry = page.getByTestId('photo-gallery-entry');
    this.cashbookEntry = page.getByTestId('cashbook-entry');

    this.periodSelector = page.getByTestId('period-selector');
    this.periodTabWeekly = this.periodSelector.getByRole('tab', { name: '주간' });
    this.periodTabMonthly = this.periodSelector.getByRole('tab', { name: '월간' });
    this.periodTabYearly = this.periodSelector.getByRole('tab', { name: '연간' });

    this.periodNavigator = page.getByTestId('period-navigator');
    this.periodNavLabel = page.getByTestId('period-nav-label');
    this.periodPrevButton = page.getByTestId('period-prev');
    this.periodNextButton = page.getByTestId('period-next');

    this.groupTabs = page.getByTestId('group-tabs');
    this.groupTabAll = this.groupTabs.getByRole('tab', { name: '전체' });
    this.groupTabIncome = this.groupTabs.getByRole('tab', { name: '수입' });
    this.groupTabExpense = this.groupTabs.getByRole('tab', { name: '지출' });
    this.groupTabFlex = this.groupTabs.getByRole('tab', { name: 'FLEX' });
    this.groupTabInvestment = this.groupTabs.getByRole('tab', { name: '투자' });

    this.totalAmount = page.getByTestId('dashboard-total');
    this.trendChart = page.getByTestId('trend-chart');
    this.categoryDonut = page.getByTestId('category-donut');
    this.emptyState = page.getByTestId('dashboard-empty');
    this.categorySelector = page.getByTestId('category-selector');

    this.recentPhotosSection = page.getByTestId('recent-photos');
    this.monthlySummarySection = page.getByTestId('monthly-summary');
  }

  async goto() {
    await this.page.goto('/');
  }
}
