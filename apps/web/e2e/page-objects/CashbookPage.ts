import { type Page, type Locator } from '@playwright/test';

export class CashbookPage {
  readonly page: Page;
  readonly header: Locator;
  readonly addButton: Locator;
  readonly monthlySummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('cashbook-header');
    this.addButton = page.getByTestId('add-entry-button');
    this.monthlySummary = page.getByTestId('monthly-summary');
  }

  async goto() {
    await this.page.goto('/inner/cashbook/history');
  }

  // Filter bar + sheet
  get prevMonthButton() {
    return this.page.getByTestId('cashbook-prev-month');
  }

  get nextMonthButton() {
    return this.page.getByTestId('cashbook-next-month');
  }

  get periodLabel() {
    return this.page.getByTestId('cashbook-period-label');
  }

  get yearLabel() {
    return this.page.getByTestId('cashbook-year-label');
  }

  get sortSelect() {
    return this.page.getByTestId('cashbook-sort-select');
  }

  get filterTrigger() {
    return this.page.getByTestId('cashbook-filter-trigger');
  }

  get filterCount() {
    return this.page.getByTestId('cashbook-filter-count');
  }

  get filterSheet() {
    return this.page.getByTestId('cashbook-filter-sheet');
  }

  get keywordInput() {
    return this.page.getByTestId('filter-keyword-input');
  }

  periodPreset(preset: string) {
    return this.page.getByTestId(`filter-period-${preset}`);
  }

  get periodStart() {
    return this.page.getByTestId('filter-period-start');
  }

  get periodEnd() {
    return this.page.getByTestId('filter-period-end');
  }

  typeFilter(type: string) {
    return this.page.getByTestId(`filter-type-${type}`);
  }

  get categoryTrigger() {
    return this.page.getByTestId('filter-category-trigger');
  }

  categoryOption(name: string) {
    return this.page.getByTestId(`filter-category-option-${name}`);
  }

  get applyButton() {
    return this.page.getByTestId('filter-apply');
  }

  get resetButton() {
    return this.page.getByTestId('filter-reset');
  }

  get filterResultSummary() {
    return this.page.getByTestId('filter-result-summary');
  }

  async openFilter() {
    await this.filterTrigger.click();
    await this.filterSheet.waitFor({ state: 'visible' });
  }

  async applyFilter() {
    await this.applyButton.click();
    await this.filterSheet.waitFor({ state: 'hidden' });
  }

  // Bottom Sheet form
  get sheet() {
    return this.page.getByRole('dialog');
  }

  get amountInput() {
    return this.page.getByLabel('금액');
  }

  get dateInput() {
    return this.page.getByLabel('날짜');
  }

  get memoInput() {
    return this.page.getByLabel('메모 (선택)');
  }

  get saveButton() {
    return this.sheet.getByRole('button', { name: '저장' });
  }

  get deleteButton() {
    return this.sheet.getByRole('button', { name: '삭제' });
  }

  categoryChip(name: string) {
    return this.page.getByTestId(`category-chip-${name}`);
  }

  recommendedChip(name: string) {
    return this.page.getByTestId(`recommended-chip-${name}`);
  }

  get categoryBreadcrumb() {
    return this.page.getByTestId('category-breadcrumb');
  }

  get categoryHint() {
    return this.page.getByTestId('category-hint');
  }

  get categoryRecommendations() {
    return this.page.getByTestId('category-recommendations');
  }

  typeTab(name: string) {
    return this.sheet.getByRole('tab', { name });
  }

  entryCard(id: string) {
    return this.page.getByTestId(`entry-card-${id}`);
  }

  // 예측 점선 박스 (SYNC-02~05)
  get predictionPrompt() {
    return this.page.getByTestId('prediction-prompt-box');
  }

  get predictionConfirm() {
    return this.page.getByTestId('prediction-confirm');
  }

  get predictionReject() {
    return this.page.getByTestId('prediction-reject');
  }

  get predictionEdit() {
    return this.page.getByTestId('prediction-edit');
  }

  async addEntry(options: {
    type?: string;
    amount: number;
    category: string;
    description?: string;
  }) {
    await this.addButton.click();
    await this.sheet.waitFor({ state: 'visible' });

    if (options.type) {
      await this.typeTab(options.type).click();
    }

    await this.amountInput.fill(String(options.amount));

    // 카테고리 칩이 렌더링될 때까지 대기 후 클릭 (자동 스크롤)
    const chip = this.categoryChip(options.category);
    await chip.waitFor({ state: 'attached', timeout: 10000 });
    await chip.scrollIntoViewIfNeeded();
    await chip.click();

    if (options.description) {
      await this.memoInput.fill(options.description);
    }

    await this.saveButton.click();
  }
}
