import { type Page, type Locator } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly header: Locator;
  readonly profileAvatar: Locator;
  readonly profileName: Locator;
  readonly profileEmail: Locator;
  readonly deleteAccountButton: Locator;
  readonly languageRow: Locator;
  readonly languageSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('settings-header');
    this.profileAvatar = page.getByTestId('settings-profile-avatar');
    this.profileName = page.getByTestId('settings-profile-name');
    this.profileEmail = page.getByTestId('settings-profile-email');
    this.deleteAccountButton = page.getByTestId('delete-account-button');
    this.languageRow = page.getByTestId('settings-language');
    this.languageSelect = page.getByTestId('settings-language-select');
  }

  async goto() {
    await this.page.goto('/settings');
  }

  /** 회원탈퇴 버튼이 있는 프로필 편집 페이지 */
  async gotoProfile() {
    await this.page.goto('/settings/profile');
  }

  /** 언어 셀렉트를 열고 로케일 옵션을 고른다 */
  async selectLanguage(locale: 'ko' | 'en') {
    await this.languageSelect.click();
    await this.page.getByTestId(`settings-language-option-${locale}`).click();
  }
}
