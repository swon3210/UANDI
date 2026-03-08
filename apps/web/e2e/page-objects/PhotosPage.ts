import { type Page, type Locator } from '@playwright/test';

export class PhotosPage {
  readonly page: Page;
  readonly header: Locator;
  readonly tabAll: Locator;
  readonly tabFolders: Locator;
  readonly tabTags: Locator;
  readonly createFolderBtn: Locator;
  readonly folderNameInput: Locator;
  readonly submitFolderBtn: Locator;
  readonly folderMenuBtn: Locator;
  readonly bottomNav: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.tabAll = page.getByTestId('tab-all');
    this.tabFolders = page.getByTestId('tab-folders');
    this.tabTags = page.getByTestId('tab-tags');
    this.createFolderBtn = page.getByTestId('create-folder-btn');
    this.folderNameInput = page.getByLabel('폴더 이름');
    this.submitFolderBtn = page.getByRole('button', { name: '만들기' });
    this.folderMenuBtn = page.getByTestId('folder-menu-btn');
    this.bottomNav = page.getByTestId('bottom-nav');
  }

  async goto() {
    await this.page.goto('/photos');
  }

  async switchToTab(tab: 'all' | 'folders' | 'tags') {
    const tabMap = { all: this.tabAll, folders: this.tabFolders, tags: this.tabTags };
    await tabMap[tab].click();
  }

  getPhotoThumbnails() {
    return this.page.locator('.grid a[href^="/photos/"]');
  }

  getFolderCards() {
    return this.page.locator('[data-testid^="folder-card-"]');
  }

  getTagBadges() {
    return this.page.locator('a[href^="/photos/tag/"]');
  }

  getEmptyStateTitle() {
    return this.page.locator('p.text-base.font-semibold');
  }
}
