import { type Page, type Locator } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  readonly createCoupleButton: Locator;
  readonly joinCoupleButton: Locator;
  readonly inviteCodeDisplay: Locator;
  readonly copyButton: Locator;
  readonly connectButton: Locator;
  readonly errorMessage: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createCoupleButton = page.getByRole('button', { name: '새 커플 공간 만들기' });
    this.joinCoupleButton = page.getByRole('button', { name: '초대 코드 입력하기' });
    this.inviteCodeDisplay = page.getByTestId('invite-code');
    this.copyButton = page.getByRole('button', { name: '복사하기' });
    this.connectButton = page.getByRole('button', { name: '연결하기' });
    this.errorMessage = page.locator('p[role="alert"]');
    this.backButton = page.getByRole('button', { name: '뒤로' });
  }

  async goto() {
    await this.page.goto('/onboarding');
  }

  // InputOTP 입력: 내부 hidden input에 직접 fill
  async fillOtp(code: string) {
    await this.page.locator('[data-input-otp]').fill(code);
  }
}
