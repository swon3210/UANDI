import { type Page, type Locator } from '@playwright/test';

export class CommunityPage {
  readonly page: Page;
  readonly sidebarTrigger: Locator;
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly emptyState: Locator;
  readonly spaceRoot: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebarTrigger = page.getByTestId('sidebar-trigger');
    this.sidebar = page.getByTestId('app-sidebar');
    this.header = page.getByTestId('community-header');
    this.emptyState = page.getByTestId('community-empty');
    this.spaceRoot = page.locator('[data-space="community"]');
  }

  async goto() {
    await this.page.goto('/community');
  }

  feedLink(): Locator {
    return this.sidebar.getByRole('link', { name: '피드' });
  }
}
