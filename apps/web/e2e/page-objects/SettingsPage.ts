import { type Page, type Locator } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly header: Locator;
  readonly profileAvatar: Locator;
  readonly profileName: Locator;
  readonly profileEmail: Locator;
  readonly accountLink: Locator;
  readonly deleteAccountButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('settings-header');
    this.profileAvatar = page.getByTestId('settings-profile-avatar');
    this.profileName = page.getByTestId('settings-profile-name');
    this.profileEmail = page.getByTestId('settings-profile-email');
    this.accountLink = page.getByTestId('settings-account');
    this.deleteAccountButton = page.getByTestId('delete-account-button');
  }

  async goto() {
    await this.page.goto('/settings');
  }

  /** 프로필 편집 페이지(이름·사진) */
  async gotoProfile() {
    await this.page.goto('/settings/profile');
  }

  /** 계정 관리 페이지(로그아웃·회원탈퇴) */
  async gotoAccount() {
    await this.page.goto('/settings/account');
  }
}
