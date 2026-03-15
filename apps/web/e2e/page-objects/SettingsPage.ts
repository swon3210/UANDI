import { type Page, type Locator } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly header: Locator;
  readonly profileAvatar: Locator;
  readonly profileName: Locator;
  readonly profileEmail: Locator;
  readonly deleteAccountButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('settings-header');
    this.profileAvatar = page.getByTestId('settings-profile-avatar');
    this.profileName = page.getByTestId('settings-profile-name');
    this.profileEmail = page.getByTestId('settings-profile-email');
    this.deleteAccountButton = page.getByTestId('delete-account-button');
  }

  async goto() {
    await this.page.goto('/settings');
  }
}
