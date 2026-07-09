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

  /** 상단 "시작 현금" 히어로 카드(설정 아이콘 없이 편집 진입점). */
  get baselineCard(): Locator {
    return this.page.getByTestId('cashflow-baseline-card');
  }

  get baselineAmount(): Locator {
    return this.page.getByTestId('cashflow-baseline-amount');
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

  /** "갱신" 버튼 — 누르면 LLM 예측을 다시 추론한다. */
  get predictButton(): Locator {
    return this.page.getByTestId('cashflow-predict-button');
  }

  get predictStatus(): Locator {
    return this.page.getByTestId('cashflow-predict-status');
  }

  /** LLM 예측(◇ source='llm') 거래 행 — 펼친 카드 안에서 "AI 예측" 보조 라벨로 식별. */
  get llmPredictionRows(): Locator {
    return this.page.getByTestId('cashflow-txn-row').filter({ hasText: 'AI 예측' });
  }

  /** 진입 시 자동 로드(또는 갱신)가 끝날 때까지 대기 — 상태 텍스트가 종료 상태(반영/찾지 못함)가 될 때까지. */
  async waitForPredictionDone() {
    await this.page
      .getByTestId('cashflow-predict-status')
      .filter({ hasText: /반영|찾지 못했어요/ })
      .first()
      .waitFor({ state: 'visible' });
  }

  /** "갱신" 버튼을 눌러 재추론하고 완료를 기다린다. */
  async refreshPrediction() {
    await this.predictButton.click();
    await this.waitForPredictionDone();
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
