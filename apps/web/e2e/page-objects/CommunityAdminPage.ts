import { type Page, type Locator } from '@playwright/test';

export class CommunityAdminPage {
  readonly page: Page;
  readonly root: Locator;
  readonly pendingTab: Locator;
  readonly reportedTab: Locator;
  readonly sourcesTab: Locator;
  readonly pendingCards: Locator;
  readonly reportedCards: Locator;
  readonly sourceItems: Locator;
  readonly crawlNowButton: Locator;
  readonly addSourceButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('community-admin');
    this.pendingTab = this.root.getByRole('tab', { name: '승인 대기' });
    this.reportedTab = this.root.getByRole('tab', { name: '신고됨' });
    this.sourcesTab = this.root.getByRole('tab', { name: '소스 관리' });
    this.pendingCards = page.getByTestId('admin-pending-card');
    this.reportedCards = page.getByTestId('admin-reported-card');
    this.sourceItems = page.getByTestId('source-list-item');
    this.crawlNowButton = page.getByTestId('crawl-now');
    this.addSourceButton = this.root.getByRole('button', { name: '소스 추가' });
  }

  sourceToggle(item: Locator): Locator {
    return item.getByTestId('source-toggle');
  }

  editButton(item: Locator): Locator {
    return item.getByRole('button', { name: '수정' });
  }

  deleteButton(item: Locator): Locator {
    return item.getByRole('button', { name: '삭제' });
  }

  async goto() {
    await this.page.goto('/community/admin');
  }

  approveButton(card: Locator): Locator {
    return card.getByRole('button', { name: '승인' });
  }

  rejectButton(card: Locator): Locator {
    return card.getByRole('button', { name: '반려' });
  }

  hideButton(card: Locator): Locator {
    return card.getByRole('button', { name: '숨김' });
  }

  keepButton(card: Locator): Locator {
    return card.getByRole('button', { name: '유지' });
  }
}
