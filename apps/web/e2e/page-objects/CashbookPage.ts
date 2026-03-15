import { type Page, type Locator } from '@playwright/test';

export class CashbookPage {
  readonly page: Page;
  readonly header: Locator;
  readonly addButton: Locator;
  readonly monthSelector: Locator;
  readonly monthlySummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('cashbook-header');
    this.addButton = page.getByTestId('add-entry-button');
    this.monthSelector = page.getByTestId('month-selector');
    this.monthlySummary = page.getByTestId('monthly-summary');
  }

  async goto() {
    await this.page.goto('/cashbook');
  }

  // Month selector
  get prevMonthButton() {
    return this.monthSelector.getByRole('button').first();
  }

  get nextMonthButton() {
    return this.monthSelector.getByRole('button').last();
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

  typeTab(name: string) {
    return this.sheet.getByRole('tab', { name });
  }

  entryCard(id: string) {
    return this.page.getByTestId(`entry-card-${id}`);
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
