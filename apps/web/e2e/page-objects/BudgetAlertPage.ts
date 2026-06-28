import { type Page, type Locator } from '@playwright/test';

export class BudgetAlertPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  banner(): Locator {
    return this.page.getByTestId('budget-alert-banner');
  }

  /** 배너 전체를 한 번에 닫는 버튼 */
  dismissAll(): Locator {
    return this.page.getByTestId('budget-alert-dismiss-all');
  }

  /** 월간 페이지로 가는 "자세히 보기" 링크 */
  detailLink(): Locator {
    return this.page.getByTestId('budget-alert-detail-link');
  }

  async gotoMain() {
    await this.page.goto('/inner/cashbook/history');
  }

  async gotoWeekly() {
    await this.page.goto('/inner/cashbook/history/weekly');
  }

  async gotoMonthly() {
    await this.page.goto('/inner/cashbook/history/monthly');
    await this.page.waitForSelector('[data-testid="monthly-overview"]', { timeout: 15000 });
  }
}
