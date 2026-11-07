import { type Page, type Locator } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly appleLoginButton: Locator;
  readonly errorMessage: Locator;
  readonly hero: Locator;
  readonly features: Locator;
  readonly inviteBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.getByTestId('google-login-btn');
    this.appleLoginButton = page.getByTestId('apple-login-btn');
    this.errorMessage = page.getByTestId('login-error');
    this.hero = page.getByTestId('landing-hero');
    this.features = page.getByTestId('landing-features');
    this.inviteBanner = page.getByTestId('landing-invite-banner');
  }

  async goto() {
    await this.page.goto('/');
  }
}
