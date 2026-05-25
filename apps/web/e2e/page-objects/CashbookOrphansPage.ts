import { type Page, type Locator } from '@playwright/test';

export class CashbookOrphansPage {
  readonly page: Page;
  readonly header: Locator;
  readonly backButton: Locator;
  readonly headerTotalCount: Locator;
  readonly loadMoreButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('orphans-header');
    this.backButton = page.getByTestId('header-left');
    this.headerTotalCount = page.getByTestId('orphans-total-count');
    this.loadMoreButton = page.getByTestId('orphans-load-more');
  }

  async goto() {
    await this.page.goto('/cashbook/categories/orphans');
  }

  groupCard(name: string) {
    return this.page.getByTestId(`orphan-group-${name}`);
  }

  groupRemapButton(name: string) {
    return this.groupCard(name).getByTestId('orphan-group-remap');
  }

  groupEntryRow(groupName: string, entryId: string) {
    return this.groupCard(groupName).getByTestId(`orphan-entry-${entryId}`);
  }

  get sheet() {
    return this.page.getByRole('dialog');
  }

  sheetCategoryChip(name: string) {
    return this.sheet.getByTestId(`category-chip-${name}`);
  }

  get sheetConfirmButton() {
    return this.sheet.getByTestId('remap-confirm');
  }

  get sheetCancelButton() {
    return this.sheet.getByTestId('remap-cancel');
  }
}
