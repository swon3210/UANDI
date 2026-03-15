import { type Page, type Locator } from '@playwright/test';

export class CashbookCategoriesPage {
  readonly page: Page;
  readonly header: Locator;
  readonly backButton: Locator;
  readonly addButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('categories-header');
    this.backButton = page.getByTestId('header-left');
    this.addButton = page.getByRole('button', { name: '카테고리 추가' });
  }

  async goto() {
    await this.page.goto('/cashbook/categories');
  }

  tab(name: string) {
    return this.page.getByRole('tab', { name });
  }

  async selectTab(name: string) {
    await this.tab(name).click();
  }

  sectionHeader(name: string) {
    return this.page.getByTestId(`subgroup-header-${name}`);
  }

  categoryItem(name: string) {
    return this.page.getByTestId(`category-item-${name}`);
  }

  categoryMenuButton(name: string) {
    return this.categoryItem(name).getByRole('button', { name: '더보기' });
  }

  async openCategoryMenu(name: string) {
    await this.categoryMenuButton(name).click();
  }

  menuItem(name: string) {
    return this.page.getByRole('menuitem', { name });
  }

  // Bottom Sheet form
  get sheet() {
    return this.page.getByRole('dialog');
  }

  get nameInput() {
    return this.page.getByLabel('이름');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: '저장' });
  }

  async addCategory(name: string, icon?: string) {
    await this.addButton.click();
    await this.nameInput.fill(name);
    if (icon) {
      await this.page.getByTestId(`icon-option-${icon}`).click();
    }
    await this.saveButton.click();
  }

  async editCategory(oldName: string, newName: string) {
    await this.openCategoryMenu(oldName);
    await this.menuItem('편집').click();
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
    await this.saveButton.click();
  }

  async deleteCategory(name: string) {
    await this.openCategoryMenu(name);
    await this.menuItem('삭제').click();
  }
}
