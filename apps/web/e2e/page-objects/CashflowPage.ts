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

  get predictionDelete(): Locator {
    return this.page.getByTestId('cashflow-prediction-delete');
  }

  get predictButton(): Locator {
    return this.page.getByTestId('cashflow-predict-button');
  }

  get predictResult(): Locator {
    return this.page.getByTestId('cashflow-predict-result');
  }

  get llmPredictions(): Locator {
    return this.page.getByTestId('cashflow-llm-predictions');
  }

  async runPrediction() {
    await this.predictButton.click();
    await this.predictResult.waitFor({ state: 'visible' });
  }

  /** 닫혀 있는 카드를 모두 펼친다(예측 거래는 펼친 카드 안에서만 보임). */
  async expandAllCards() {
    const n = await this.cards.count();
    for (let i = 0; i < n; i++) {
      const card = this.cards.nth(i);
      if ((await card.getAttribute('data-state')) === 'closed') {
        await card.locator('button').first().click();
      }
    }
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
