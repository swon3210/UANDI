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
  readonly complete: Locator;
  readonly savedToast: Locator;
  // 크롭 다이얼로그
  readonly cropper: Locator;
  readonly cropApply: Locator;
  readonly cropCancel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('profile-edit-header');
    this.avatar = page.getByTestId('profile-avatar');
    this.avatarInput = page.getByTestId('profile-avatar-input');
    this.avatarChange = page.getByTestId('profile-avatar-change');
    this.avatarRemove = page.getByTestId('profile-avatar-remove');
    this.avatarProgress = page.getByTestId('profile-avatar-progress');
    this.nameInput = page.getByTestId('profile-name-input');
    this.complete = page.getByTestId('profile-complete');
    this.savedToast = page.getByText('프로필을 저장했어요.');
    this.cropper = page.getByTestId('avatar-cropper');
    this.cropApply = page.getByTestId('avatar-crop-apply');
    this.cropCancel = page.getByTestId('avatar-crop-cancel');
  }

  async goto() {
    await this.page.goto('/settings/profile');
  }

  /** 파일 선택 → 크롭 다이얼로그에서 '적용'까지. (draft만 설정, 저장 아님) */
  async pickAndCrop(buffer: Buffer, name = 'avatar.png') {
    await this.avatarInput.setInputFiles({ name, mimeType: 'image/png', buffer });
    await this.cropApply.click();
  }

  async setName(name: string) {
    await this.nameInput.fill(name);
  }

  /** 완료 클릭 후 저장 성공 토스트가 뜰 때까지 대기. */
  async submit() {
    await this.complete.click();
    await this.savedToast.first().waitFor({ state: 'visible' });
  }
}
