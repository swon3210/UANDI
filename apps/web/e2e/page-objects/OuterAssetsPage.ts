import { type Page, type Locator, expect } from '@playwright/test';

export const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

/** 재테크 예적금(/outer/savings) */
export class SavingsPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly formSheet: Locator;
  readonly cards: Locator;
  readonly summary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addButton = page.getByTestId('savings-add-button');
    this.formSheet = page.getByTestId('savings-form-sheet');
    this.cards = page.getByTestId('savings-account-card');
    this.summary = page.getByTestId('savings-summary-card');
  }

  async goto() {
    await this.page.goto('/outer/savings');
    await expect(this.page.getByTestId('outer-savings-header')).toBeVisible({ timeout: 10000 });
  }

  field(label: string): Locator {
    return this.formSheet.getByLabel(label, { exact: true });
  }

  async importScreenshot() {
    await this.formSheet
      .getByTestId('savings-import-button-input')
      .setInputFiles([{ name: 'product.png', mimeType: 'image/png', buffer: ONE_PX_PNG }]);
  }

  async submit() {
    await this.formSheet.getByTestId('savings-submit').click();
    await expect(this.formSheet).toBeHidden();
  }
}

/** 재테크 투자(/outer/investment) — 주식/부동산 탭 */
export class InvestmentPage {
  readonly page: Page;
  readonly stockCards: Locator;
  readonly realEstateCards: Locator;
  readonly stockForm: Locator;
  readonly realEstateForm: Locator;

  constructor(page: Page) {
    this.page = page;
    this.stockCards = page.getByTestId('stock-holding-card');
    this.realEstateCards = page.getByTestId('real-estate-card');
    this.stockForm = page.getByTestId('stock-form-sheet');
    this.realEstateForm = page.getByTestId('real-estate-form-sheet');
  }

  async goto() {
    await this.page.goto('/outer/investment');
    await expect(this.page.getByTestId('outer-investment-header')).toBeVisible({ timeout: 10000 });
  }

  async openRealEstateTab() {
    await this.page.getByTestId('investment-tab-real-estate').click();
  }

  async importStockScreenshot() {
    await this.page
      .getByTestId('stock-import-button-input')
      .setInputFiles([{ name: 'balance.png', mimeType: 'image/png', buffer: ONE_PX_PNG }]);
  }

  // 시/군/구 목록은 길어 Radix Select 뷰포트 밖에 놓일 수 있다 → 포커스 + Enter로 선택
  async selectOption(trigger: Locator, option: string) {
    await trigger.click();
    const item = this.page.getByRole('option', { name: option, exact: true });
    await item.focus();
    await item.press('Enter');
    await expect(trigger).toContainText(option);
  }
}
