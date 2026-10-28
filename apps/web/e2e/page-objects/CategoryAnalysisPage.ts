import { type Page, type Locator } from '@playwright/test';

/** 카테고리 AI 분석 페이지 (/inner/cashbook/analysis) — 선택한 카테고리 종합 분석 */
export class CategoryAnalysisPage {
  readonly page: Page;
  readonly header: Locator;
  readonly backButton: Locator;
  readonly title: Locator;
  readonly month: Locator;
  readonly current: Locator;
  readonly compare: Locator;
  readonly compareLabel: Locator;
  readonly delta: Locator;
  readonly chart: Locator;
  readonly breakdown: Locator;
  readonly report: Locator;
  readonly loading: Locator;
  readonly retry: Locator;
  readonly error: Locator;
  readonly entries: Locator;
  readonly empty: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('category-analysis-header');
    this.backButton = page.getByTestId('category-analysis-back');
    this.title = page.getByTestId('category-analysis-title');
    this.month = page.getByTestId('category-analysis-month');
    this.current = page.getByTestId('category-analysis-current');
    this.compare = page.getByTestId('category-analysis-compare');
    this.compareLabel = page.getByTestId('category-analysis-compare-label');
    this.delta = page.getByTestId('category-analysis-delta');
    this.chart = page.getByTestId('category-analysis-chart');
    this.breakdown = page.getByTestId('category-analysis-breakdown');
    this.report = page.getByTestId('category-analysis-report');
    this.loading = page.getByTestId('category-analysis-loading');
    this.retry = page.getByTestId('category-analysis-retry');
    this.error = page.getByTestId('category-analysis-error');
    this.entries = page.getByTestId('category-analysis-entries');
    this.empty = page.getByTestId('category-analysis-empty');
  }

  /** 분석 대상 카테고리 칩 */
  chip(name: string): Locator {
    return this.page.getByTestId(`category-analysis-chip-${name}`);
  }

  /** 카테고리별 이번 달 vs 비교 대상 행 */
  row(name: string): Locator {
    return this.page.getByTestId(`category-analysis-row-${name}`);
  }

  async goto(query: string) {
    await this.page.goto(`/inner/cashbook/analysis${query}`);
  }
}
