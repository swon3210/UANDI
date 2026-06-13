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

  /** 설정 시트에서 현재 보유 현금을 입력하고 저장한다(Phase 2: 결제일 수동 입력 폐지). */
  async fillSettings(options: { currentCash: number }) {
    await this.currentCashInput.fill(String(options.currentCash));
    await this.saveButton.click();
    await this.settingsSheet.waitFor({ state: 'hidden' });
  }
}
