import { type Page, type Locator } from '@playwright/test';

type CategoryKey = 'income' | 'expense' | 'investment' | 'flex';

export class AnnualPlanPage {
  readonly page: Page;
  readonly heroCard: Locator;
  readonly heroNetAmount: Locator;
  readonly detailView: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroCard = page.getByTestId('goals-hero-card');
    this.heroNetAmount = page.getByTestId('hero-net-amount');
    this.detailView = page.getByTestId('goal-detail-view');
    this.backButton = page.getByTestId('goal-detail-back');
  }

  async goto() {
    await this.page.goto('/cashbook/plan/annual');
  }

  async gotoCategory(key: CategoryKey) {
    await this.page.goto(`/cashbook/plan/annual?category=${key}`);
  }

  goalCard(key: CategoryKey) {
    return this.page.getByTestId(`goal-card-${key}`);
  }

  goalCardAmount(key: CategoryKey) {
    return this.page.getByTestId(`goal-card-${key}-amount`);
  }

  goalCardCta(key: CategoryKey) {
    return this.page.getByTestId(`goal-card-${key}-cta`);
  }

  goalDetailHeader(key: CategoryKey) {
    return this.page.getByTestId(`goal-detail-header-${key}`);
  }

  goalDetailHeaderAmount(key: CategoryKey) {
    return this.page.getByTestId(`goal-detail-header-${key}-amount`);
  }

  /** 메인에서 카테고리 카드를 눌러 상세 뷰로 진입. */
  async drillIntoCategory(key: CategoryKey) {
    await this.goalCardCta(key).click();
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

  get flexTotalDisplay() {
    return this.page.getByTestId('flex-total');
  }

  get previousYearSuggestion() {
    return this.page.getByTestId('previous-year-suggestion');
  }

  get applySuggestionButton() {
    return this.page.getByRole('button', { name: '제안 적용' });
  }
}
