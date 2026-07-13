import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { AppSidebarPage } from '../page-objects/AppSidebarPage';

/**
 * 전역 네비게이션 — 헤더 좌측 햄버거(☰) → 좌측 사이드바 드로어.
 * docs/08-spaces.md §4 "네비게이션 패턴"을 사용자 스토리로 변환한 E2E.
 * 가계부의 루트(/inner/cashbook)는 대시보드를 렌더한다.
 */
test.describe('전역 사이드바 네비게이션 (AppSidebar)', () => {
  test('햄버거를 누르면 사이드바가 열리고 4개 목적지(가계부/갤러리/재테크/커뮤니티)가 보인다', async ({
    authedPage,
  }) => {
    const nav = new AppSidebarPage(authedPage);
    await expect(nav.trigger).toBeVisible();
    await nav.open();
    await expect(nav.linkCashbook).toBeVisible();
    await expect(nav.linkPhotos).toBeVisible();
    await expect(nav.linkOuter).toBeVisible();
    await expect(nav.linkCommunity).toBeVisible();
  });

  test('로그인 후 가계부 루트(대시보드)로 진입하고 사이드바에서 가계부가 활성화된다', async ({
    authedPage,
  }) => {
    const nav = new AppSidebarPage(authedPage);
    await expect(authedPage).toHaveURL(/\/inner\/cashbook$/);
    await nav.open();
    await expect(nav.linkCashbook).toHaveAttribute('aria-current', 'page');
  });

  test('사이드바 항목을 누르면 해당 목적지로 이동하고 그 항목이 활성화된다', async ({
    authedPage,
  }) => {
    const nav = new AppSidebarPage(authedPage);
    await expect(authedPage).toHaveURL(/\/inner\/cashbook$/);

    await nav.open();
    await nav.linkPhotos.click();
    await authedPage.waitForURL(/\/inner\/photos$/, { timeout: 60000 });
    await nav.open();
    await expect(nav.linkPhotos).toHaveAttribute('aria-current', 'page');
    await expect(nav.linkCashbook).not.toHaveAttribute('aria-current', 'page');

    await nav.linkOuter.click();
    await authedPage.waitForURL(/\/outer$/, { timeout: 60000 });
    await nav.open();
    await expect(nav.linkOuter).toHaveAttribute('aria-current', 'page');

    await nav.linkCommunity.click();
    await authedPage.waitForURL(/\/community$/, { timeout: 60000 });
    await nav.open();
    await expect(nav.linkCommunity).toHaveAttribute('aria-current', 'page');

    await nav.linkCashbook.click();
    await authedPage.waitForURL(/\/inner\/cashbook$/, { timeout: 60000 });
    await nav.open();
    await expect(nav.linkCashbook).toHaveAttribute('aria-current', 'page');
  });

  test('가계부 하위 페이지에서도 사이드바에서 가계부가 활성 상태로 유지된다', async ({
    authedPage,
  }) => {
    const nav = new AppSidebarPage(authedPage);
    await authedPage.goto('/inner/cashbook/review');
    await nav.open();
    await expect(nav.linkCashbook).toHaveAttribute('aria-current', 'page');
  });

  test('항목을 누르면 사이드바가 닫힌다', async ({ authedPage }) => {
    const nav = new AppSidebarPage(authedPage);
    await nav.open();
    await nav.linkPhotos.click();
    await authedPage.waitForURL(/\/inner\/photos$/, { timeout: 60000 });
    await expect(nav.sidebar).toHaveCount(0);
  });

  test('재테크로 진입하면 indigo 톤(data-space=outer)이 적용된다', async ({ authedPage }) => {
    const nav = new AppSidebarPage(authedPage);
    await nav.open();
    await nav.linkOuter.click();
    await authedPage.waitForURL(/\/outer$/, { timeout: 60000 });
    await expect(nav.spaceRoot('outer')).toBeVisible();
  });

  test('커뮤니티로 진입하면 violet 톤(data-space=community)이 적용된다', async ({
    authedPage,
  }) => {
    const nav = new AppSidebarPage(authedPage);
    await nav.open();
    await nav.linkCommunity.click();
    await authedPage.waitForURL(/\/community$/, { timeout: 60000 });
    await expect(nav.spaceRoot('community')).toBeVisible();
  });

  test('전역 하단탭(app-nav)은 더 이상 존재하지 않는다', async ({ authedPage }) => {
    await expect(authedPage.getByTestId('app-nav')).toHaveCount(0);
  });

  test('비로그인·온보딩 미완 사용자에게는 사이드바 토글이 보이지 않는다', async ({
    noCoupleAuthedPage,
  }) => {
    // 온보딩 미완 사용자는 AppShell이 렌더되지 않으므로 헤더 햄버거가 없다
    const nav = new AppSidebarPage(noCoupleAuthedPage);
    await expect(noCoupleAuthedPage).toHaveURL(/\/onboarding/);
    await expect(nav.trigger).toHaveCount(0);
  });

  test('모든 목적지(가계부/갤러리/재테크/커뮤니티)에서 프로필 메뉴가 보인다', async ({
    authedPage,
  }) => {
    const nav = new AppSidebarPage(authedPage);
    const profile = authedPage.getByTestId('profile-menu-trigger');

    // 가계부(요약) — 시작 위치
    await expect(profile).toBeVisible();

    await nav.open();
    await nav.linkPhotos.click();
    await authedPage.waitForURL(/\/inner\/photos$/, { timeout: 60000 });
    await expect(profile).toBeVisible();

    await nav.open();
    await nav.linkOuter.click();
    await authedPage.waitForURL(/\/outer$/, { timeout: 60000 });
    await expect(profile).toBeVisible();

    await nav.open();
    await nav.linkCommunity.click();
    await authedPage.waitForURL(/\/community$/, { timeout: 60000 });
    await expect(profile).toBeVisible();
  });
});
