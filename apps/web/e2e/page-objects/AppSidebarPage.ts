import { type Page, type Locator } from '@playwright/test';

export type SidebarLinkKey = 'cashbook' | 'photos' | 'outer' | 'community';

/**
 * 헤더 좌측 햄버거(☰) → 좌측 사이드바 드로어 네비게이션 POM.
 * 하단탭을 대체하는 전역 네비게이션 진입점을 캡슐화한다.
 */
export class AppSidebarPage {
  readonly page: Page;
  /** 헤더의 사이드바 토글(햄버거) 버튼 */
  readonly trigger: Locator;
  /** 열린 사이드바 드로어 컨테이너 */
  readonly sidebar: Locator;

  readonly linkCashbook: Locator;
  readonly linkPhotos: Locator;
  readonly linkOuter: Locator;
  readonly linkCommunity: Locator;

  constructor(page: Page) {
    this.page = page;
    this.trigger = page.getByTestId('sidebar-trigger');
    this.sidebar = page.getByTestId('app-sidebar');

    this.linkCashbook = this.sidebar.getByRole('link', { name: '가계부' });
    this.linkPhotos = this.sidebar.getByRole('link', { name: '갤러리' });
    this.linkOuter = this.sidebar.getByRole('link', { name: '홈', exact: true });
    this.linkCommunity = this.sidebar.getByRole('link', { name: '피드' });
  }

  /** 사이드바를 열고 드로어가 보일 때까지 대기한다. */
  async open() {
    await this.trigger.click();
    await this.sidebar.waitFor({ state: 'visible' });
  }

  link(key: SidebarLinkKey): Locator {
    const map: Record<SidebarLinkKey, Locator> = {
      cashbook: this.linkCashbook,
      photos: this.linkPhotos,
      outer: this.linkOuter,
      community: this.linkCommunity,
    };
    return map[key];
  }

  spaceRoot(space: 'inner' | 'outer' | 'community'): Locator {
    return this.page.locator(`[data-space="${space}"]`);
  }
}
