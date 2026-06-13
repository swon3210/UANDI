import { type Page, type Locator } from '@playwright/test';

export type NavTabKey = 'cashbook' | 'photos' | 'outer' | 'community';

/**
 * 전역 하단탭(데스크톱 좌측 레일) 네비게이션 POM.
 * AppShell 안에서 인증·커플 연결 사용자에게 상시 노출되는 5개 탭을 캡슐화한다.
 */
export class AppNavPage {
  readonly page: Page;
  readonly root: Locator;
  readonly tabCashbook: Locator;
  readonly tabPhotos: Locator;
  readonly tabOuter: Locator;
  readonly tabCommunity: Locator;

  // 제거 검증용(이전 사이드바 네비)
  readonly legacySidebarTrigger: Locator;
  readonly legacySidebar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId('app-nav');
    this.tabCashbook = page.getByTestId('nav-tab-cashbook');
    this.tabPhotos = page.getByTestId('nav-tab-photos');
    this.tabOuter = page.getByTestId('nav-tab-outer');
    this.tabCommunity = page.getByTestId('nav-tab-community');

    this.legacySidebarTrigger = page.getByTestId('sidebar-trigger');
    this.legacySidebar = page.getByTestId('app-sidebar');
  }

  tab(key: NavTabKey): Locator {
    const map: Record<NavTabKey, Locator> = {
      cashbook: this.tabCashbook,
      photos: this.tabPhotos,
      outer: this.tabOuter,
      community: this.tabCommunity,
    };
    return map[key];
  }

  spaceRoot(space: 'inner' | 'outer' | 'community'): Locator {
    return this.page.locator(`[data-space="${space}"]`);
  }
}
