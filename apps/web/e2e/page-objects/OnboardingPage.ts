import { type Page, type Locator } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  // 단계 1 — 선택 카드
  readonly createCoupleButton: Locator;
  readonly joinCoupleButton: Locator;
  // 단계 2A — 초대 코드 화면
  readonly inviteCodeDisplay: Locator;
  readonly copyButton: Locator;
  readonly shareLinkButton: Locator;
  readonly startAloneButton: Locator;
  // 단계 2B — 코드 입력
  readonly inviteHint: Locator;
  readonly connectButton: Locator;
  readonly errorMessage: Locator;
  // 단계 3 — 연결 완료
  readonly connectedState: Locator;
  readonly connectedStartButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createCoupleButton = page.getByRole('button', { name: '새 커플 공간 만들기' });
    this.joinCoupleButton = page.getByRole('button', { name: '초대 코드 입력하기' });
    this.inviteCodeDisplay = page.getByTestId('invite-code');
    this.copyButton = page.getByRole('button', { name: '코드 복사' });
    this.shareLinkButton = page.getByRole('button', { name: '링크 공유' });
    this.startAloneButton = page.getByTestId('start-alone');
    this.inviteHint = page.getByTestId('invite-hint');
    this.connectButton = page.getByRole('button', { name: '연결하기' });
    this.errorMessage = page.getByTestId('join-error');
    this.connectedState = page.getByTestId('couple-connected');
    this.connectedStartButton = page.getByTestId('connected-start');
    this.backButton = page.getByRole('button', { name: '뒤로' });
  }

  async goto() {
    await this.page.goto('/onboarding');
  }

  // InputOTP 입력: 내부 hidden input에 직접 fill
  async fillOtp(code: string) {
    await this.page.locator('[data-input-otp]').fill(code);
  }

  /** 현재 표시된 초대 코드(공백 제거) */
  async readInviteCode(): Promise<string> {
    return (await this.inviteCodeDisplay.textContent())?.replace(/\s/g, '') ?? '';
  }
}
