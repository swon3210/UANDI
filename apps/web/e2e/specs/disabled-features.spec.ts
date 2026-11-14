import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { AppSidebarPage } from '../page-objects/AppSidebarPage';

/**
 * 당장 관리하지 않는 기능(재테크 /outer, 커뮤니티 /community)은 접근을 막는다.
 * 가계부·갤러리만 열려 있다. (src/lib/disabled-features.ts)
 */
test.describe('관리하지 않는 기능 접근 차단', () => {
  const blockedPaths = [
    '/outer',
    '/outer/forex',
    '/outer/forex/USD',
    '/outer/investment',
    '/outer/savings',
    '/outer/allocation',
    '/community',
    '/community/admin',
    '/community/some-post-id',
  ];

  for (const path of blockedPaths) {
    test(`${path} 로 직접 들어가면 가계부로 이동한다`, async ({ authedPage }) => {
      await authedPage.goto(path);
      await expect(authedPage).toHaveURL(/\/inner\/cashbook$/);
    });
  }

  test('비로그인 사용자가 막힌 경로로 들어가면 홈으로 간다', async ({ page }) => {
    await page.goto('/community');
    await expect(page).toHaveURL(/\/$/);
  });

  test('가계부와 갤러리는 그대로 열린다', async ({ authedPage }) => {
    await authedPage.goto('/inner/photos');
    await expect(authedPage).toHaveURL(/\/inner\/photos$/);
    await authedPage.goto('/inner/cashbook');
    await expect(authedPage).toHaveURL(/\/inner\/cashbook$/);
  });

  test('사이드바에 재테크·커뮤니티 메뉴가 없다', async ({ authedPage }) => {
    const nav = new AppSidebarPage(authedPage);
    await nav.open();
    await expect(nav.linkCashbook).toBeVisible();
    await expect(nav.linkPhotos).toBeVisible();
    await expect(nav.sidebar.getByRole('link', { name: '환테크' })).toHaveCount(0);
    await expect(nav.linkOuter).toHaveCount(0);
    await expect(nav.linkCommunity).toHaveCount(0);
  });
});
