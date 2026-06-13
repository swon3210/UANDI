import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { AppNavPage } from '../page-objects/AppNavPage';

/**
 * Phase 1 — 전역 하단탭 네비게이션(AppNav).
 * docs/08-spaces.md §4 "하단탭 항목 구성(4개)" 명세를 사용자 스토리로 변환한 E2E.
 * 가계부 탭의 루트(/inner/cashbook)는 대시보드를 렌더한다.
 */
test.describe('전역 하단탭 네비게이션 (AppNav)', () => {
  test('인증·커플 사용자에게 4개 탭(가계부/갤러리/재테크/커뮤니티)이 표시된다', async ({
    authedPage,
  }) => {
    const nav = new AppNavPage(authedPage);
    await expect(nav.root).toBeVisible();
    await expect(nav.tabCashbook).toBeVisible();
    await expect(nav.tabPhotos).toBeVisible();
    await expect(nav.tabOuter).toBeVisible();
    await expect(nav.tabCommunity).toBeVisible();
  });

  test('로그인 후 가계부 루트(대시보드)로 진입하고 가계부 탭이 활성화된다', async ({
    authedPage,
  }) => {
    const nav = new AppNavPage(authedPage);
    await expect(authedPage).toHaveURL(/\/inner\/cashbook$/);
    await expect(nav.tabCashbook).toHaveAttribute('aria-current', 'page');
  });

  test('각 탭을 누르면 해당 목적지로 이동하고 그 탭이 활성화된다', async ({ authedPage }) => {
    const nav = new AppNavPage(authedPage);
    await expect(authedPage).toHaveURL(/\/inner\/cashbook$/);

    await nav.tabPhotos.click();
    await authedPage.waitForURL(/\/inner\/photos$/, { timeout: 60000 });
    await expect(nav.tabPhotos).toHaveAttribute('aria-current', 'page');
    await expect(nav.tabCashbook).not.toHaveAttribute('aria-current', 'page');

    await nav.tabOuter.click();
    await authedPage.waitForURL(/\/outer$/, { timeout: 60000 });
    await expect(nav.tabOuter).toHaveAttribute('aria-current', 'page');

    await nav.tabCommunity.click();
    await authedPage.waitForURL(/\/community$/, { timeout: 60000 });
    await expect(nav.tabCommunity).toHaveAttribute('aria-current', 'page');

    await nav.tabCashbook.click();
    await authedPage.waitForURL(/\/inner\/cashbook$/, { timeout: 60000 });
    await expect(nav.tabCashbook).toHaveAttribute('aria-current', 'page');
  });

  test('가계부 하위 페이지에서도 가계부 탭이 활성 상태로 유지된다', async ({ authedPage }) => {
    const nav = new AppNavPage(authedPage);
    await authedPage.goto('/inner/cashbook/settlement');
    await expect(nav.root).toBeVisible();
    await expect(nav.tabCashbook).toHaveAttribute('aria-current', 'page');
  });

  test('재테크 탭으로 진입하면 indigo 톤(data-space=outer)이 적용된다', async ({ authedPage }) => {
    const nav = new AppNavPage(authedPage);
    await nav.tabOuter.click();
    await authedPage.waitForURL(/\/outer$/, { timeout: 60000 });
    await expect(nav.spaceRoot('outer')).toBeVisible();
  });

  test('커뮤니티 탭으로 진입하면 violet 톤(data-space=community)이 적용된다', async ({
    authedPage,
  }) => {
    const nav = new AppNavPage(authedPage);
    await nav.tabCommunity.click();
    await authedPage.waitForURL(/\/community$/, { timeout: 60000 });
    await expect(nav.spaceRoot('community')).toBeVisible();
  });

  test('비로그인·온보딩 미완 사용자에게는 하단탭이 보이지 않는다', async ({
    noCoupleAuthedPage,
  }) => {
    // 온보딩 미완 사용자는 AppShell이 렌더되지 않으므로 탭이 없다
    const nav = new AppNavPage(noCoupleAuthedPage);
    await expect(noCoupleAuthedPage).toHaveURL(/\/onboarding/);
    await expect(nav.root).toHaveCount(0);
  });

  test('헤더의 사이드바 토글(☰)과 드로어가 더 이상 존재하지 않는다', async ({ authedPage }) => {
    const nav = new AppNavPage(authedPage);
    await expect(nav.legacySidebarTrigger).toHaveCount(0);
    await expect(nav.legacySidebar).toHaveCount(0);
  });

  test('모든 하단탭 목적지(가계부/갤러리/재테크/커뮤니티)에서 프로필 메뉴가 보인다', async ({
    authedPage,
  }) => {
    const nav = new AppNavPage(authedPage);
    const profile = authedPage.getByTestId('profile-menu-trigger');

    // 가계부(요약) — 시작 위치
    await expect(profile).toBeVisible();

    await nav.tabPhotos.click();
    await authedPage.waitForURL(/\/inner\/photos$/, { timeout: 60000 });
    await expect(profile).toBeVisible();

    await nav.tabOuter.click();
    await authedPage.waitForURL(/\/outer$/, { timeout: 60000 });
    await expect(profile).toBeVisible();

    await nav.tabCommunity.click();
    await authedPage.waitForURL(/\/community$/, { timeout: 60000 });
    await expect(profile).toBeVisible();
  });

  test('데스크톱(≥md)에서는 하단탭이 좌측 고정 레일로 바뀐다', async ({ authedPage }) => {
    await authedPage.setViewportSize({ width: 1280, height: 800 });
    const nav = new AppNavPage(authedPage);
    await expect(nav.root).toBeVisible();
    await expect(nav.tabCashbook).toBeVisible();
    const box = await nav.root.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeLessThan(40); // 좌측에 고정
      expect(box.height).toBeGreaterThan(box.width); // 세로 레일
    }
  });

  test('모바일에서는 하단 고정 탭바로 표시된다', async ({ authedPage }) => {
    await authedPage.setViewportSize({ width: 390, height: 844 });
    const nav = new AppNavPage(authedPage);
    await expect(nav.root).toBeVisible();
    const box = await nav.root.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(box.height); // 가로 바
      expect(box.y + box.height).toBeGreaterThan(800); // 하단에 고정
    }
  });
});
