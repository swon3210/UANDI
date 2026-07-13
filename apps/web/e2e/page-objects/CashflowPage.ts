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

  get setupButton(): Locator {
    return this.page.getByTestId('cashflow-setup-button');
  }

  get settingsSheet(): Locator {
    return this.page.getByTestId('cashflow-settings-sheet');
  }

  /** 상단 "오늘 예상 현금" 히어로 카드(설정 아이콘 없이 편집 진입점). */
  get baselineCard(): Locator {
    return this.page.getByTestId('cashflow-baseline-card');
  }

  /** 큰 숫자 = 오늘 기준 예상 잔액(최초 현금 + 기준일 이후 실거래 누적). */
  get baselineAmount(): Locator {
    return this.page.getByTestId('cashflow-baseline-amount');
  }

  /** 사람별 최초 현금 입력들(멤버 순서대로 cashflow-initial-cash-0, -1 …). */
  get initialCashInputs(): Locator {
    return this.page.locator('input[data-testid^="cashflow-initial-cash-"]');
  }

  /** 첫 멤버의 최초 현금 입력(단일 값 시나리오 호환용). */
  get initialCashInput(): Locator {
    return this.page.getByTestId('cashflow-initial-cash-0');
  }

  get initialDateInput(): Locator {
    return this.page.getByTestId('cashflow-initial-date');
  }

  /** 상단 히어로/카드의 사람별 잔액 칩. */
  get memberBalances(): Locator {
    return this.page.getByTestId('cashflow-member-balance');
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

  /**
   * 설정 시트에서 최초 현금(과 선택적으로 기준일)을 입력하고 저장한다.
   * 사람별 입력이 여러 개면 첫 멤버에 값을 넣고 나머지는 0으로 채워 합계 == initialCash가 되게 한다.
   * 기준일 미지정 시 폼 기본값(오늘)을 그대로 둔다.
   */
  async fillSettings(options: { initialCash: number; initialDate?: string }) {
    if (options.initialDate) {
      await this.initialDateInput.fill(options.initialDate);
    }
    const inputs = this.initialCashInputs;
    const n = await inputs.count();
    for (let i = 0; i < n; i++) {
      await inputs.nth(i).fill(i === 0 ? String(options.initialCash) : '0');
    }
    await this.saveButton.click();
    await this.settingsSheet.waitFor({ state: 'hidden' });
  }

  /**
   * 설정 시트에서 사람별 최초 현금을 순서대로 입력하고 저장한다(멤버 순서 = 입력 순서).
   * 기준일 미지정 시 폼 기본값(오늘)을 그대로 둔다.
   */
  async fillSettingsPerPerson(amounts: number[], initialDate?: string) {
    if (initialDate) {
      await this.initialDateInput.fill(initialDate);
    }
    const inputs = this.initialCashInputs;
    for (let i = 0; i < amounts.length; i++) {
      await inputs.nth(i).fill(String(amounts[i]));
    }
    await this.saveButton.click();
    await this.settingsSheet.waitFor({ state: 'hidden' });
  }
}
