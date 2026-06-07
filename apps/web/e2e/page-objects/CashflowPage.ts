import { type Page, type Locator } from '@playwright/test';

export class CashflowPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/inner/cashbook/cashflow');
  }

  get cards(): Locator {
    return this.page.getByTestId('cashflow-card');
  }

  get cardList(): Locator {
    return this.page.getByTestId('cashflow-card-list');
  }

  get negativeBanner(): Locator {
    return this.page.getByTestId('cashflow-negative-banner');
  }

  get settingsButton(): Locator {
    return this.page.getByTestId('cashflow-settings-button');
  }

  get setupButton(): Locator {
    return this.page.getByTestId('cashflow-setup-button');
  }

  get settingsSheet(): Locator {
    return this.page.getByTestId('cashflow-settings-sheet');
  }

  get currentCashInput(): Locator {
    return this.page.getByTestId('cashflow-current-cash');
  }

  get addPaydayButton(): Locator {
    return this.page.getByTestId('cashflow-add-payday');
  }

  get paydayRows(): Locator {
    return this.page.getByTestId('cashflow-payday-row');
  }

  get saveButton(): Locator {
    return this.page.getByTestId('cashflow-settings-save');
  }

  get addPredictionButton(): Locator {
    return this.page.getByTestId('cashflow-add-prediction');
  }

  get predictionDelete(): Locator {
    return this.page.getByTestId('cashflow-prediction-delete');
  }

  async openSettings() {
    await this.settingsButton.click();
    await this.settingsSheet.waitFor({ state: 'visible' });
  }

  /** 설정 시트에서 현재 보유 현금 + (선택) 결제일 1개를 입력하고 저장한다. */
  async fillSettings(options: { currentCash: number; payday?: { label: string; day: number } }) {
    await this.currentCashInput.fill(String(options.currentCash));
    if (options.payday) {
      await this.addPaydayButton.click();
      const row = this.paydayRows.last();
      await row.getByPlaceholder('이름 (예: 신한카드)').fill(options.payday.label);
      await row.getByLabel('결제 일자').fill(String(options.payday.day));
    }
    await this.saveButton.click();
    await this.settingsSheet.waitFor({ state: 'hidden' });
  }
}
