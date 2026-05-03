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

  // 슬라이드쇼 관련
  readonly slideshowContainer: Locator;
  readonly slideshowImage: Locator;
  readonly slideshowPosition: Locator;
  readonly slideshowFolderLink: Locator;
  readonly slideshowTags: Locator;
  readonly slideshowCloseBtn: Locator;
  readonly slideshowEditBtn: Locator;
  readonly slideshowDeleteBtn: Locator;
  readonly slideshowCaption: Locator;
  readonly slideshowCaptionToggle: Locator;

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

    // 슬라이드쇼
    this.slideshowContainer = page.getByTestId('slideshow-container');
    this.slideshowImage = page.getByTestId('slideshow-image');
    this.slideshowPosition = page.getByTestId('slideshow-position');
    this.slideshowFolderLink = page.getByTestId('slideshow-folder-name');
    this.slideshowTags = page.getByTestId('slideshow-tags');
    this.slideshowCloseBtn = page.getByTestId('slideshow-close-btn');
    this.slideshowEditBtn = page.getByTestId('slideshow-edit-btn');
    this.slideshowDeleteBtn = page.getByTestId('slideshow-delete-btn');
    this.slideshowCaption = page.getByTestId('slideshow-caption');
    this.slideshowCaptionToggle = page.getByTestId('slideshow-caption-toggle');
  }

  async goto() {
    await this.page.goto('/photos');
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
    return this.page.locator('[data-testid^="photo-item-"]');
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

  /** 그리드의 N번째(0-base) 썸네일 클릭 → 슬라이드쇼 진입 대기 */
  async clickPhotoToOpenSlideshow(index: number) {
    await this.getPhotoThumbnails().nth(index).click();
    await this.slideshowContainer.waitFor({ state: 'visible' });
  }
}
