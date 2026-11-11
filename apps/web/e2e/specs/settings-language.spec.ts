import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { SettingsPage } from '../page-objects/SettingsPage';

// 언어 설정 — /settings 첫 화면의 "언어" 행에서 한국어/English 를 고른다.
// 선택값은 쿠키(uandi-locale)와 users/{uid}.locale 에 저장돼 새로고침·재로그인 후에도 유지된다.
// Playwright 는 locale: 'ko-KR' 로 고정돼 있어(playwright.config.ts) 기본은 항상 한국어다.

test.describe('설정 — 언어', () => {
  test('기본 언어는 한국어이고 언어 행이 보인다', async ({ authedContext }) => {
    const { page } = authedContext;
    const settings = new SettingsPage(page);
    await settings.goto();

    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    await expect(settings.header).toContainText('설정');
    await expect(settings.languageRow).toBeVisible();
    await expect(settings.languageSelect).toContainText('한국어');
  });

  test('English 로 바꾸면 화면이 영어로 전환되고 새로고침 후에도 유지된다', async ({
    authedContext,
  }) => {
    const { page } = authedContext;
    const settings = new SettingsPage(page);
    await settings.goto();

    await settings.selectLanguage('en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(settings.header).toContainText('Settings');
    await expect(settings.languageSelect).toContainText('English');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(settings.header).toContainText('Settings');
  });

  test('쿠키가 지워져도(새 기기) users.locale 로 영어가 복원된다', async ({ authedContext }) => {
    const { page, context } = { page: authedContext.page, context: authedContext.page.context() };
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.selectLanguage('en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // 언어 쿠키만 지우고(새 기기 시나리오) 다시 들어오면 AuthInit 이 users.locale 로 복원한다.
    const cookies = await context.cookies();
    await context.clearCookies();
    await context.addCookies(cookies.filter((c) => c.name !== 'uandi-locale'));

    await settings.goto();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(settings.header).toContainText('Settings');
  });

  test('한국어로 되돌릴 수 있다', async ({ authedContext }) => {
    const { page } = authedContext;
    const settings = new SettingsPage(page);
    await settings.goto();

    await settings.selectLanguage('en');
    await expect(settings.header).toContainText('Settings');

    await settings.selectLanguage('ko');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    await expect(settings.header).toContainText('설정');
  });
});
