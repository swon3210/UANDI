import { type Page, type Locator } from '@playwright/test';

export class CashbookPage {
  readonly page: Page;
  readonly header: Locator;
  readonly addButton: Locator;
  readonly monthlySummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('cashbook-header');
    // 헤더의 직접 추가 버튼은 제거됨. 빈 상태의 "추가하기" 버튼으로 폼을 연다.
    this.addButton = page.getByTestId('empty-add-entry-button');
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

  creatorChip(uid: string) {
    return this.page.getByTestId(`filter-creator-${uid}`);
  }

  // 카테고리 다중선택 전용 시트(필터 시트 위에 중첩으로 열림)
  get categoryPickerTrigger() {
    return this.page.getByTestId('filter-category-picker-trigger');
  }

  get categoryPickerSheet() {
    return this.page.getByTestId('category-filter-sheet');
  }

  categoryPickerTab(type: string) {
    return this.page.getByTestId(`category-filter-tab-${type}`);
  }

  categoryPickerOption(name: string) {
    return this.page.getByTestId(`filter-category-option-${name}`);
  }

  get categoryPickerApply() {
    return this.page.getByTestId('category-filter-apply');
  }

  /** 현재 타입 탭의 카테고리를 한 번에 선택/해제하는 토글 버튼. */
  get categoryPickerToggleAll() {
    return this.page.getByTestId('category-filter-toggle-all');
  }

  async openCategoryPicker() {
    await this.categoryPickerTrigger.click();
    await this.categoryPickerSheet.waitFor({ state: 'visible' });
  }

  async applyCategoryPicker() {
    await this.categoryPickerApply.click();
    await this.categoryPickerSheet.waitFor({ state: 'hidden' });
  }

  /** 카테고리 picker 열기 → 이름들 토글 → picker 적용까지 한 번에. */
  async selectCategories(...names: string[]) {
    await this.openCategoryPicker();
    for (const name of names) {
      await this.categoryPickerOption(name).click();
    }
    await this.applyCategoryPicker();
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

  // 회고 배너 (SYNC-06)
  get retroBanner() {
    return this.page.getByTestId('prediction-retro-banner');
  }

  get retroItem() {
    return this.page.getByTestId('retro-item');
  }

  get retroConfirm() {
    return this.page.getByTestId('retro-confirm');
  }

  get retroReject() {
    return this.page.getByTestId('retro-reject');
  }

  get retroDismiss() {
    return this.page.getByTestId('retro-dismiss');
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
