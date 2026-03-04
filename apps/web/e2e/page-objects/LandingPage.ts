import { type Page, type Locator } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.getByTestId('google-login-btn');
    this.errorMessage = page.getByTestId('login-error');
  }

  async goto() {
    await this.page.goto('/');
  }
}
