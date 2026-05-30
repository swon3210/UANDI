import { type Page, type Locator, expect } from '@playwright/test';

type Bucket = 'savings' | 'stocks' | 'realEstate' | 'crypto' | 'forex';

export class AssetAllocationPage {
  readonly page: Page;
  readonly editor: Locator;
  readonly total: Locator;
  readonly totalWarning: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.editor = page.getByTestId('asset-allocation-editor');
    this.total = page.getByTestId('allocation-total');
    this.totalWarning = page.getByTestId('allocation-total-warning');
    this.saveButton = page.getByTestId('allocation-save');
  }

  async goto() {
    await this.page.goto('/outer/allocation');
    await expect(this.editor).toBeVisible({ timeout: 10000 });
  }

  value(bucket: Bucket): Locator {
    return this.page.getByTestId(`allocation-value-${bucket}`);
  }

  slider(bucket: Bucket): Locator {
    return this.page.getByTestId(`allocation-row-${bucket}`).getByRole('slider');
  }

  // 슬라이더 thumb에 포커스를 주고 방향키로 step(5)만큼 조정한다
  async nudge(bucket: Bucket, direction: 'up' | 'down', steps = 1) {
    const slider = this.slider(bucket);
    await slider.focus();
    const key = direction === 'up' ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < steps; i++) {
      await slider.press(key);
    }
  }

  async save() {
    await this.saveButton.click();
  }
}
