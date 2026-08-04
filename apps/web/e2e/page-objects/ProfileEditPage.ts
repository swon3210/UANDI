import { type Page, type Locator } from '@playwright/test';

export class ProfileEditPage {
  readonly page: Page;
  readonly header: Locator;
  readonly avatar: Locator;
  readonly avatarInput: Locator;
  readonly avatarChange: Locator;
  readonly avatarRemove: Locator;
  readonly avatarProgress: Locator;
  readonly nameInput: Locator;
  readonly nameSave: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('profile-edit-header');
    this.avatar = page.getByTestId('profile-avatar');
    this.avatarInput = page.getByTestId('profile-avatar-input');
    this.avatarChange = page.getByTestId('profile-avatar-change');
    this.avatarRemove = page.getByTestId('profile-avatar-remove');
    this.avatarProgress = page.getByTestId('profile-avatar-progress');
    this.nameInput = page.getByTestId('profile-name-input');
    this.nameSave = page.getByTestId('profile-name-save');
  }

  async goto() {
    await this.page.goto('/settings/profile');
  }

  async uploadAvatar(buffer: Buffer, name = 'avatar.png') {
    await this.avatarInput.setInputFiles({ name, mimeType: 'image/png', buffer });
  }

  async setName(name: string) {
    await this.nameInput.fill(name);
    await this.nameSave.click();
  }
}
