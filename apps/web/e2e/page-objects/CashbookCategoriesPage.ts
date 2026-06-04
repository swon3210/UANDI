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
    await this.page.goto('/inner/cashbook/categories');
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

  // 부모 카테고리 카드/행 (testid는 부모/자식 공통)
  categoryItem(name: string) {
    return this.page.getByTestId(`category-item-${name}`);
  }

  // 부모 카드 안의 description 텍스트
  categoryDescription(name: string) {
    return this.categoryItem(name).getByTestId('category-description');
  }

  categoryMenuButton(name: string) {
    return this.page.getByTestId(`category-item-${name}-menu`);
  }

  async openCategoryMenu(name: string) {
    await this.categoryMenuButton(name).click();
  }

  menuItem(name: string) {
    return this.page.getByRole('menuitem', { name });
  }

  // 자식 카테고리 chip
  childChip(name: string) {
    return this.page.getByTestId(`category-child-${name}`);
  }

  childMenuButton(name: string) {
    return this.page.getByTestId(`category-child-${name}-menu`);
  }

  // 부모 카드 내부 "+ 하위 추가" 인라인 버튼
  addChildButton(parentName: string) {
    return this.categoryItem(parentName).getByRole('button', {
      name: '하위 추가',
    });
  }

  // Bottom Sheet form
  get sheet() {
    return this.page.getByRole('dialog');
  }

  get nameInput() {
    return this.page.getByLabel('이름');
  }

  get descriptionInput() {
    return this.page.getByLabel('설명 (선택)');
  }

  get examplesInput() {
    return this.page.getByLabel('예시 항목 (선택)');
  }

  get saveButton() {
    return this.page.getByRole('button', { name: '저장' });
  }

  // 자식 추가 시트 안의 잠긴 부모 표시
  get lockedParentLabel() {
    return this.page.getByTestId('locked-parent');
  }

  // ── 정기 발생(고정 지출·수입) 섹션 ──
  get recurrenceSection() {
    return this.page.getByTestId('recurrence-section');
  }

  get recurrenceSwitch() {
    return this.page.getByTestId('recurrence-enabled-switch');
  }

  recurrenceKind(kind: 'dayOfMonth' | 'nthWeekday') {
    return this.page.getByTestId(`recurrence-kind-${kind}`);
  }

  get recurrenceDayInput() {
    return this.page.getByTestId('recurrence-day-input');
  }

  recurrenceWeekButton(week: number) {
    return this.page.getByTestId(`recurrence-week-${week}`);
  }

  recurrenceWeekdayButton(weekday: number) {
    return this.page.getByTestId(`recurrence-weekday-${weekday}`);
  }

  get recurrenceLeadInput() {
    return this.page.getByTestId('recurrence-lead-input');
  }

  get recurrenceAmountInput() {
    return this.page.getByTestId('recurrence-amount-input');
  }

  // 카테고리 카드에 노출되는 정기 발생 배지
  recurrenceBadge(name: string) {
    return this.categoryItem(name).getByTestId('category-recurrence-badge');
  }

  // 자식 chip에 노출되는 정기 발생 배지
  childRecurrenceBadge(name: string) {
    return this.childChip(name).getByTestId('category-recurrence-badge');
  }

  async openEdit(name: string) {
    await this.openCategoryMenu(name);
    await this.menuItem('편집').click();
  }

  async addCategory(
    name: string,
    options?: { icon?: string; description?: string; examples?: string[] }
  ) {
    await this.addButton.click();
    await this.nameInput.fill(name);
    if (options?.icon) {
      await this.page.getByTestId(`icon-option-${options.icon}`).click();
    }
    if (options?.description) {
      await this.descriptionInput.fill(options.description);
    }
    if (options?.examples) {
      for (const ex of options.examples) {
        await this.examplesInput.fill(ex);
        await this.examplesInput.press('Enter');
      }
    }
    await this.saveButton.click();
  }

  async addChildCategory(
    parentName: string,
    childName: string,
    options?: { icon?: string; description?: string; examples?: string[] }
  ) {
    await this.openCategoryMenu(parentName);
    await this.menuItem('하위 추가').click();
    await this.nameInput.fill(childName);
    if (options?.icon) {
      await this.page.getByTestId(`icon-option-${options.icon}`).click();
    }
    if (options?.description) {
      await this.descriptionInput.fill(options.description);
    }
    if (options?.examples) {
      for (const ex of options.examples) {
        await this.examplesInput.fill(ex);
        await this.examplesInput.press('Enter');
      }
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

  async editChildCategory(oldName: string, newName: string) {
    await this.childMenuButton(oldName).click();
    await this.menuItem('편집').click();
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
    await this.saveButton.click();
  }

  async deleteCategory(name: string) {
    await this.openCategoryMenu(name);
    await this.menuItem('삭제').click();
  }

  async deleteChildCategory(name: string) {
    await this.childMenuButton(name).click();
    await this.menuItem('삭제').click();
  }
}
