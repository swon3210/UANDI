import { type Page, type Locator } from '@playwright/test';

/** 계정 관리 페이지(/settings/account) — 이메일·로그인 수단·로그아웃·회원탈퇴 */
export class AccountPage {
  readonly page: Page;
  readonly header: Locator;
  readonly back: Locator;
  readonly email: Locator;
  readonly provider: Locator;
  readonly signOutButton: Locator;
  readonly deleteAccountButton: Locator;
  readonly deleteDialog: Locator;
  readonly deleteConfirm: Locator;
  readonly deleteCancel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('account-header');
    this.back = page.getByTestId('header-back');
    this.email = page.getByTestId('account-email');
    this.provider = page.getByTestId('account-provider');
    this.signOutButton = page.getByTestId('sign-out-button');
    this.deleteAccountButton = page.getByTestId('delete-account-button');
    this.deleteDialog = page.getByTestId('delete-account-dialog');
    this.deleteConfirm = page.getByTestId('delete-account-confirm');
    this.deleteCancel = page.getByTestId('delete-account-cancel');
  }

  async goto() {
    await this.page.goto('/settings/account');
  }
}
