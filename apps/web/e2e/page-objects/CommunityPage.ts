import { type Page, type Locator } from '@playwright/test';

export class CommunityPage {
  readonly page: Page;
  readonly sidebarTrigger: Locator;
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly emptyState: Locator;
  readonly spaceRoot: Locator;

  readonly postCards: Locator;
  readonly userPostCards: Locator;
  readonly scrapedPostCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebarTrigger = page.getByTestId('sidebar-trigger');
    this.sidebar = page.getByTestId('app-sidebar');
    this.header = page.getByTestId('community-header');
    this.emptyState = page.getByTestId('community-empty');
    this.spaceRoot = page.locator('[data-space="community"]');
    this.postCards = page.getByTestId('community-post-card');
    this.userPostCards = page.locator('[data-testid="community-post-card"][data-type="user"]');
    this.scrapedPostCards = page.locator(
      '[data-testid="community-post-card"][data-type="scraped"]'
    );
  }

  async goto() {
    await this.page.goto('/community');
  }

  feedLink(): Locator {
    return this.sidebar.getByRole('link', { name: '피드' });
  }

  /** 카드 내부에서 작성자/제목/본문/링크 등을 찾는 헬퍼 */
  cardByText(text: string): Locator {
    return this.postCards.filter({ hasText: text });
  }
}
