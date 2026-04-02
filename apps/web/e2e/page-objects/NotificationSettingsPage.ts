import { type Page, type Locator } from '@playwright/test';

export class NotificationSettingsPage {
  readonly page: Page;
  readonly header: Locator;
  readonly recordReminderSwitch: Locator;
  readonly budgetWarningSwitch: Locator;
  readonly timeInput: Locator;
  readonly dayButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByTestId('notification-settings-header');
    this.recordReminderSwitch = page.getByTestId('record-reminder-switch');
    this.budgetWarningSwitch = page.getByTestId('budget-warning-switch');
    this.timeInput = page.getByTestId('reminder-time-input');
    this.dayButtons = page.getByTestId('day-selector');
  }

  async goto() {
    await this.page.goto('/cashbook/history/weekly/notifications');
    await this.page.waitForSelector('[data-testid="notification-settings-header"]', {
      timeout: 15000,
    });
  }

  dayButton(day: string) {
    return this.dayButtons.getByRole('button', { name: day });
  }
}
