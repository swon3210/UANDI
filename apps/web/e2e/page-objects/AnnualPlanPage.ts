import { type Page, type Locator } from '@playwright/test';

export class AnnualPlanPage {
  readonly page: Page;
  readonly summaryCard: Locator;
  readonly incomeTab: Locator;
  readonly expenseTab: Locator;
  readonly investmentTab: Locator;
  readonly flexTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.summaryCard = page.getByTestId('annual-summary-card');
    this.incomeTab = page.getByRole('tab', { name: '수입' });
    this.expenseTab = page.getByRole('tab', { name: '지출' });
    this.investmentTab = page.getByRole('tab', { name: '재테크' });
    this.flexTab = page.getByRole('tab', { name: 'Flex' });
  }

  async goto() {
    await this.page.goto('/cashbook/plan/annual');
  }

  summaryRow(label: string) {
    return this.summaryCard.locator(`[data-testid="summary-row-${label}"]`);
  }

  summaryAmount(label: string) {
    return this.summaryRow(label).locator('[data-testid="summary-amount"]');
  }

  planItemRow(categoryName: string) {
    return this.page.getByTestId(`plan-item-${categoryName}`);
  }

  planItemAmountInput(categoryName: string) {
    return this.planItemRow(categoryName).getByRole('spinbutton');
  }

  totalAmount(group: string) {
    return this.page.getByTestId(`total-${group}`);
  }

  get targetReturnRateInput() {
    return this.page.getByLabel('목표 수익률');
  }

  get targetAmountDisplay() {
    return this.page.getByTestId('target-amount');
  }

  get availableAmountDisplay() {
    return this.page.getByTestId('available-amount');
  }

  get allocationTotal() {
    return this.page.getByTestId('allocation-total');
  }

  get unallocatedDisplay() {
    return this.page.getByTestId('unallocated-amount');
  }

  get overBudgetWarning() {
    return this.page.getByTestId('over-budget-warning');
  }

  monthCheckbox(month: number) {
    return this.page.getByTestId(`month-checkbox-${month}`);
  }

  get flexAvailableDisplay() {
    return this.page.getByTestId('flex-available');
  }

  get flexAdditionalInput() {
    return this.page.getByLabel('추가 배정');
  }

  get flexTotalDisplay() {
    return this.page.getByTestId('flex-total');
  }

  get previousYearSuggestion() {
    return this.page.getByTestId('previous-year-suggestion');
  }

  get applySuggestionButton() {
    return this.page.getByRole('button', { name: '제안 적용' });
  }

  get rateIncreaseButton() {
    return this.page.getByTestId('rate-increase');
  }

  get rateDecreaseButton() {
    return this.page.getByTestId('rate-decrease');
  }
}
