import { type Page, type Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly header: Locator;
  readonly bottomNav: Locator;
  readonly recentPhotosSection: Locator;
  readonly recentPhotosViewAll: Locator;
  readonly photoThumbnails: Locator;
  readonly uploadButton: Locator;
  readonly monthlySummarySection: Locator;
  readonly cashbookViewAll: Locator;
  readonly incomeAmount: Locator;
  readonly expenseAmount: Locator;
  readonly balanceAmount: Locator;
  readonly recentEntries: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('dashboard-header');
    this.bottomNav = page.getByTestId('bottom-nav');
    this.recentPhotosSection = page.getByTestId('recent-photos');
    this.recentPhotosViewAll = page
      .getByTestId('recent-photos')
      .getByRole('link', { name: '전체 보기' });
    this.photoThumbnails = page.getByTestId('recent-photos').getByTestId('photo-thumbnail');
    this.uploadButton = page
      .getByTestId('recent-photos')
      .getByTestId('photo-upload-placeholder')
      .first();
    this.monthlySummarySection = page.getByTestId('monthly-summary');
    this.cashbookViewAll = page
      .getByTestId('monthly-summary')
      .getByRole('link', { name: '전체 보기' });
    this.incomeAmount = page.getByTestId('summary-income');
    this.expenseAmount = page.getByTestId('summary-expense');
    this.balanceAmount = page.getByTestId('summary-balance');
    this.recentEntries = page.getByTestId('recent-entry');
  }

  async goto() {
    await this.page.goto('/');
  }
}
