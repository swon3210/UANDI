import { type Page, type Locator } from '@playwright/test';

export class CashbookWeeklyPage {
  readonly page: Page;
  readonly weekSelector: Locator;
  readonly prevWeekButton: Locator;
  readonly nextWeekButton: Locator;
  readonly summaryCard: Locator;
  readonly dailyList: Locator;
  readonly categoryBreakdown: Locator;
  readonly addExpenseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.weekSelector = page.getByTestId('week-selector');
    this.prevWeekButton = this.weekSelector.getByRole('button').first();
    this.nextWeekButton = this.weekSelector.getByRole('button').last();
    this.summaryCard = page.getByTestId('weekly-summary');
    this.dailyList = page.getByTestId('daily-expense-list');
    this.categoryBreakdown = page.getByTestId('weekly-category-breakdown');
    this.addExpenseButton = page.getByRole('button', { name: /지출 추가/ });
  }

  async goto() {
    await this.page.goto('/cashbook/history/weekly');
    await this.page.waitForSelector('[data-testid="weekly-summary"]', { timeout: 15000 });
  }

  statusBadge() {
    return this.summaryCard.getByTestId('weekly-status');
  }

  dailyRow(dayLabel: string) {
    return this.dailyList.getByTestId(`daily-row-${dayLabel}`);
  }
}
