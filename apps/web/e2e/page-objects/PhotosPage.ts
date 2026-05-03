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
  readonly folderSearchInput: Locator;
  readonly folderSortTrigger: Locator;
  readonly bottomNav: Locator;

  // 업로드 관련
  readonly uploadBtn: Locator;
  readonly uploadSubmitBtn: Locator;

  // 상세 페이지 관련
  readonly detailImage: Locator;
  readonly detailCaption: Locator;
  readonly detailFolderLink: Locator;
  readonly moreMenuBtn: Locator;

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
    this.folderSearchInput = page.getByTestId('folder-search-input');
    this.folderSortTrigger = page.getByTestId('folder-sort-select');
    this.bottomNav = page.getByTestId('bottom-nav');

    // 업로드
    this.uploadBtn = page.getByRole('button', { name: '사진 업로드' });
    this.uploadSubmitBtn = page.getByTestId('upload-submit-btn');

    // 상세
    this.detailImage = page.getByTestId('photo-detail-image');
    this.detailCaption = page.getByTestId('photo-caption');
    this.detailFolderLink = page.getByTestId('photo-folder-link');
    this.moreMenuBtn = page.getByTestId('photo-more-menu');
  }

  async goto() {
    await this.page.goto('/photos');
  }

  async gotoDetail(photoId: string) {
    await this.page.goto(`/photos/${photoId}`);
  }

  async switchToTab(tab: 'all' | 'folders' | 'tags') {
    const tabMap = { all: this.tabAll, folders: this.tabFolders, tags: this.tabTags };
    await tabMap[tab].click();
  }

  async searchFolders(text: string) {
    await this.folderSearchInput.fill(text);
  }

  async sortFoldersBy(value: 'latest' | 'oldest' | 'name') {
    const labelMap = { latest: '최신순', oldest: '오래된순', name: '글자순' };
    await this.folderSortTrigger.click();
    await this.page.getByRole('option', { name: labelMap[value] }).click();
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

  getDetailTagLinks() {
    return this.page.locator('[data-testid="photo-tags"] a');
  }
}
