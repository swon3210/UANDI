import { type Page, type Locator, type Response } from '@playwright/test';

/**
 * AI 설정 페이지(/settings/ai) — 가계부 프롬프트 맞춤화 3섹션 Page Object.
 *  A. 지출 분석(ai-analyze-*)  B. 현금흐름 예측(ai-predict-*)  C. 거래 파싱(ai-parse-*)
 * knob 옵션은 RadioGroupItem(role=radio, data-state), 토글은 Switch(aria-checked)이다.
 */
export class AiSettingsPage {
  readonly page: Page;
  readonly header: Locator;

  // A. 지출 분석
  readonly analyzeEnabled: Locator;

  // B. 현금흐름 예측
  readonly predictEnabled: Locator;

  // C. 거래 파싱
  readonly parseEnabled: Locator;
  readonly addRuleButton: Locator;
  readonly transferInput: Locator;
  readonly transferAddButton: Locator;

  readonly saveButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('ai-settings-header');

    this.analyzeEnabled = page.getByTestId('ai-analyze-enabled');
    this.predictEnabled = page.getByTestId('ai-predict-enabled');

    this.parseEnabled = page.getByTestId('ai-parse-enabled');
    this.addRuleButton = page.getByTestId('ai-parse-add-rule');
    this.transferInput = page.getByTestId('ai-parse-transfer-input');
    this.transferAddButton = page.getByTestId('ai-parse-transfer-add');

    this.saveButton = page.getByTestId('ai-pref-save');
    this.resetButton = page.getByTestId('ai-pref-reset');
  }

  async goto() {
    await this.page.goto('/settings/ai');
  }

  private async ensureOn(sw: Locator) {
    if ((await sw.getAttribute('aria-checked')) !== 'true') {
      await sw.click();
    }
  }

  enableAnalyze() {
    return this.ensureOn(this.analyzeEnabled);
  }
  enablePredict() {
    return this.ensureOn(this.predictEnabled);
  }
  enableParse() {
    return this.ensureOn(this.parseEnabled);
  }

  // A
  tone(value: 'friendly' | 'concise' | 'strict') {
    return this.page.getByTestId(`ai-analyze-tone-${value}`);
  }
  focus(value: 'saving' | 'investment' | 'balanced') {
    return this.page.getByTestId(`ai-analyze-focus-${value}`);
  }
  length(value: 'short' | 'normal' | 'detailed') {
    return this.page.getByTestId(`ai-analyze-length-${value}`);
  }

  // B
  stance(value: 'conservative' | 'standard' | 'aggressive') {
    return this.page.getByTestId(`ai-predict-stance-${value}`);
  }
  excludeChip(category: string) {
    return this.page.getByTestId(`ai-predict-exclude-${category}`);
  }

  // C
  ruleMatch(index: number) {
    return this.page.getByTestId(`ai-parse-rule-${index}-match`);
  }
  ruleCategoryTrigger(index: number) {
    return this.page.getByTestId(`ai-parse-rule-${index}-category`);
  }
  transferChip(keyword: string) {
    return this.page.getByTestId(`ai-parse-transfer-chip-${keyword}`);
  }

  /** 규칙 행의 카테고리 Select(Radix)를 열고 옵션을 고른다. */
  async selectRuleCategory(index: number, category: string) {
    await this.ruleCategoryTrigger(index).click();
    await this.page.getByRole('option', { name: category }).click();
  }

  async addTransferKeyword(keyword: string) {
    await this.transferInput.fill(keyword);
    await this.transferAddButton.click();
  }

  /** 저장 버튼을 누르고 PUT /api/ai/preferences 응답을 기다린다. */
  async save(): Promise<Response> {
    const [res] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/api/ai/preferences') && r.request().method() === 'PUT'
      ),
      this.saveButton.click(),
    ]);
    return res;
  }
}
