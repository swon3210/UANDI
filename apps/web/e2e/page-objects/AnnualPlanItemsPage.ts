import { type Page, type Locator } from '@playwright/test';

type CategoryKey = 'income' | 'expense' | 'flex';

export class AnnualPlanItemsPage {
  readonly page: Page;
  readonly header: Locator;
  readonly backButton: Locator;
  readonly addButton: Locator;
  readonly totalAmount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('annual-plan-items-header');
    this.backButton = page.getByTestId('annual-plan-items-back');
    this.addButton = page.getByTestId('annual-plan-items-add');
    this.totalAmount = page.getByTestId('annual-plan-items-total');
  }

  async goto(group: CategoryKey) {
    await this.page.goto(`/inner/cashbook/plan/annual/items?group=${group}`);
  }

  itemRow(categoryName: string) {
    return this.page.getByTestId(`plan-item-row-${categoryName}`);
  }

  itemRowAmount(categoryName: string) {
    return this.itemRow(categoryName).getByTestId(`plan-item-row-${categoryName}-amount`);
  }

  itemRowMenu(categoryName: string) {
    return this.itemRow(categoryName).getByRole('button', { name: '더보기' });
  }

  async openItemMenu(categoryName: string) {
    await this.itemRowMenu(categoryName).click();
  }

  menuItem(name: string) {
    return this.page.getByRole('menuitem', { name });
  }

  get amountInput() {
    return this.page.getByLabel('연간 금액');
  }

  get categorySelectTrigger() {
    return this.page.getByTestId('plan-item-form-category-trigger');
  }

  categorySelectOption(name: string) {
    return this.page.getByRole('option', { name });
  }

  get saveButton() {
    return this.page.getByRole('button', { name: '저장' });
  }

  get deleteConfirmButton() {
    return this.page.getByRole('button', { name: '삭제' });
  }

  async editAmount(categoryName: string, newAmount: number) {
    await this.openItemMenu(categoryName);
    await this.menuItem('편집').click();
    await this.amountInput.fill(String(newAmount));
    await this.saveButton.click();
  }

  async deleteItem(categoryName: string) {
    await this.openItemMenu(categoryName);
    await this.menuItem('삭제').click();
    await this.deleteConfirmButton.click();
  }

  async addItem(categoryName: string, amount: number) {
    await this.addButton.click();
    await this.categorySelectTrigger.click();
    await this.categorySelectOption(categoryName).click();
    await this.amountInput.fill(String(amount));
    await this.saveButton.click();
  }
}
