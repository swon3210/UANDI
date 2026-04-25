import { type Page, type Locator } from '@playwright/test';

export class BudgetAlertPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  banner(): Locator {
    return this.page.getByTestId('budget-alert-banner');
  }

  alertItem(key: string): Locator {
    return this.page.getByTestId(`budget-alert-item-${key}`);
  }

  dismissButton(key: string): Locator {
    return this.page.getByTestId(`budget-alert-dismiss-${key}`);
  }

  async gotoMonthly() {
    await this.page.goto('/cashbook/history/monthly');
    await this.page.waitForSelector('[data-testid="monthly-overview"]', { timeout: 15000 });
  }

  async gotoMain() {
    await this.page.goto('/cashbook/history');
  }

  async gotoWeekly() {
    await this.page.goto('/cashbook/history/weekly');
  }
}
