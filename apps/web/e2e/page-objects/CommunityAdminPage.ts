import { type Page, type Locator } from '@playwright/test';

export class CommunityAdminPage {
  readonly page: Page;
  readonly root: Locator;
  readonly pendingTab: Locator;
  readonly reportedTab: Locator;
  readonly pendingCards: Locator;
  readonly reportedCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('community-admin');
    this.pendingTab = this.root.getByRole('tab', { name: '승인 대기' });
    this.reportedTab = this.root.getByRole('tab', { name: '신고됨' });
    this.pendingCards = page.getByTestId('admin-pending-card');
    this.reportedCards = page.getByTestId('admin-reported-card');
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
