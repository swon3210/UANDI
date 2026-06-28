import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories } from '../helpers/emulator';

test.describe('가상 키보드와 하단 시트', () => {
  test('--keyboard-inset가 커지면 하단 시트가 그만큼 위로 올라온다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');
    await page.getByTestId('cashbook-fab').click();

    const sheet = page.getByTestId('quick-add-sheet');
    await expect(sheet).toBeVisible();

    // 키보드가 없으면 하단(0px)에 붙어 있다.
    await page.evaluate(() => document.documentElement.style.setProperty('--keyboard-inset', '0px'));
    await expect(sheet).toHaveCSS('bottom', '0px');

    // 키보드가 250px 떴다고 가정하면 시트가 그만큼 위로 올라가 입력칸이 가려지지 않는다.
    await page.evaluate(() =>
      document.documentElement.style.setProperty('--keyboard-inset', '250px')
    );
    await expect(sheet).toHaveCSS('bottom', '250px');
  });
});
