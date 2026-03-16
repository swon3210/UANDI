import { type Page, type Locator } from '@playwright/test';

export class CashbookMonthlyPage {
  readonly page: Page;
  readonly monthSelector: Locator;
  readonly prevMonthButton: Locator;
  readonly nextMonthButton: Locator;
  readonly overviewCard: Locator;
  readonly expenseTab: Locator;
  readonly incomeTab: Locator;
  readonly investmentTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.monthSelector = page.getByTestId('month-selector');
    this.prevMonthButton = this.monthSelector.getByRole('button').first();
    this.nextMonthButton = this.monthSelector.getByRole('button').last();
    this.overviewCard = page.getByTestId('monthly-overview');
    this.expenseTab = page.getByRole('tab', { name: '지출' });
    this.incomeTab = page.getByRole('tab', { name: '수입' });
    this.investmentTab = page.getByRole('tab', { name: '재테크' });
  }

  async goto() {
    await this.page.goto('/cashbook/monthly');
    await this.page.waitForSelector('[data-testid="monthly-overview"]', { timeout: 15000 });
  }

  statusBadge() {
    return this.overviewCard.getByTestId('budget-status');
  }

  categoryRow(name: string) {
    return this.page.getByTestId(`category-budget-${name}`);
  }

  weeklyTable() {
    return this.page.getByTestId('weekly-expense-table');
  }

  incomeSection() {
    return this.page.getByTestId('income-tab-content');
  }

  investmentSection() {
    return this.page.getByTestId('investment-tab-content');
  }
}
