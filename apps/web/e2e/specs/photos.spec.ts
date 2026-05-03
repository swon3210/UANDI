import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { PhotosPage } from '../page-objects/PhotosPage';
import { seedPhoto, seedFolder } from '../helpers/emulator';

test.describe('사진 갤러리', () => {
  test.describe('갤러리 메인', () => {
    test('사진이 없으면 빈 상태 메시지가 표시된다', async ({ authedContext }) => {
      const photos = new PhotosPage(authedContext.page);
      await photos.goto();
      await expect(photos.tabAll).toBeVisible();
      await expect(photos.getEmptyStateTitle()).toHaveText('아직 사진이 없어요');
    });

    test('사진이 있으면 2열 그리드에 썸네일이 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      await seedPhoto(coupleId, uid, { folderId: '', tags: [] });
      await seedPhoto(coupleId, uid, { folderId: '', tags: [] });

      const photos = new PhotosPage(page);
      await photos.goto();
      await expect(photos.getPhotoThumbnails()).toHaveCount(2, { timeout: 10000 });
    });

    test('모바일에서 하단 네비게이션이 표시된다', async ({ authedContext, browserName }) => {
      // BottomNav는 md:hidden이므로 모바일 뷰포트에서만 표시됨
      test.skip(browserName !== 'chromium' || !(test.info().project.name === 'Mobile Chrome'),
        '모바일 전용 테스트');
      const photos = new PhotosPage(authedContext.page);
      await photos.goto();
      await expect(photos.bottomNav).toBeVisible();
    });
  });

  test.describe('폴더 탭', () => {
    test('폴더가 없으면 빈 상태 메시지가 표시된다', async ({ authedContext }) => {
      const photos = new PhotosPage(authedContext.page);
      await photos.goto();
      await photos.switchToTab('folders');
      await expect(photos.getEmptyStateTitle()).toHaveText(
        '폴더를 만들어 사진을 정리해보세요'
      );
    });

    test('새 폴더를 생성할 수 있다', async ({ authedContext }) => {
      const photos = new PhotosPage(authedContext.page);
      await photos.goto();
      await photos.switchToTab('folders');
      await photos.createFolderBtn.click();

      await expect(photos.folderNameInput).toBeVisible();
      await photos.folderNameInput.fill('제주도 여행');
      await photos.submitFolderBtn.click();

      // 폴더 카드가 나타날 때까지 대기
      await expect(photos.getFolderCards()).toHaveCount(1, { timeout: 10000 });
    });

    test('폴더가 있으면 폴더 카드 목록이 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      await seedFolder(coupleId, uid, { name: '여행 사진' });
      await seedFolder(coupleId, uid, { name: '일상' });

      const photos = new PhotosPage(page);
      await photos.goto();
      await photos.switchToTab('folders');
      await expect(photos.getFolderCards()).toHaveCount(2, { timeout: 10000 });
    });

    test('검색어로 폴더를 필터링할 수 있다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      await seedFolder(coupleId, uid, { name: '제주도 여행' });
      await seedFolder(coupleId, uid, { name: '서울 카페' });
      await seedFolder(coupleId, uid, { name: '일상' });

      const photos = new PhotosPage(page);
      await photos.goto();
      await photos.switchToTab('folders');
      await expect(photos.getFolderCards()).toHaveCount(3, { timeout: 10000 });

      await photos.searchFolders('카페');
      await expect(photos.getFolderCards()).toHaveCount(1);
      await expect(photos.getFolderCards().first()).toContainText('서울 카페');
    });

    test('검색 결과가 없으면 안내 메시지가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      await seedFolder(coupleId, uid, { name: '여행 사진' });

      const photos = new PhotosPage(page);
      await photos.goto();
      await photos.switchToTab('folders');
      await expect(photos.getFolderCards()).toHaveCount(1, { timeout: 10000 });

      await photos.searchFolders('없는키워드');
      await expect(photos.getEmptyStateTitle()).toHaveText('검색 결과가 없어요');
    });

    test('글자순 정렬이 적용된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      await seedFolder(coupleId, uid, { name: '다람쥐' });
      await new Promise((r) => setTimeout(r, 5));
      await seedFolder(coupleId, uid, { name: '가나다' });
      await new Promise((r) => setTimeout(r, 5));
      await seedFolder(coupleId, uid, { name: '바나나' });

      const photos = new PhotosPage(page);
      await photos.goto();
      await photos.switchToTab('folders');
      await expect(photos.getFolderCards()).toHaveCount(3, { timeout: 10000 });

      await photos.sortFoldersBy('name');
      await expect(photos.getFolderCards().nth(0)).toContainText('가나다');
      await expect(photos.getFolderCards().nth(1)).toContainText('다람쥐');
      await expect(photos.getFolderCards().nth(2)).toContainText('바나나');
    });

    test('최신순 / 오래된순 정렬이 적용된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      // 글자순 기본값에서는 '하하하' < '가가가'가 안 되므로,
      // 최신/오래된순과 글자순 결과가 명확히 달라지도록 데이터 구성
      await seedFolder(coupleId, uid, { name: '하하하' }); // 먼저 생성, 글자순으로 마지막
      await new Promise((r) => setTimeout(r, 5));
      await seedFolder(coupleId, uid, { name: '가가가' }); // 나중 생성, 글자순으로 첫번째

      const photos = new PhotosPage(page);
      await photos.goto();
      await photos.switchToTab('folders');
      await expect(photos.getFolderCards()).toHaveCount(2, { timeout: 10000 });

      // 기본은 글자순 — '가가가'가 먼저
      await expect(photos.getFolderCards().first()).toContainText('가가가');

      // 최신순 — 나중 생성한 '가가가'가 먼저
      await photos.sortFoldersBy('latest');
      await expect(photos.getFolderCards().first()).toContainText('가가가');

      // 오래된순 — 먼저 생성한 '하하하'가 먼저
      await photos.sortFoldersBy('oldest');
      await expect(photos.getFolderCards().first()).toContainText('하하하');
    });
  });

  test.describe('태그 탭', () => {
    test('태그가 없으면 빈 상태 메시지가 표시된다', async ({ authedContext }) => {
      const photos = new PhotosPage(authedContext.page);
      await photos.goto();
      await photos.switchToTab('tags');
      await expect(photos.getEmptyStateTitle()).toHaveText('사진에 태그를 추가해보세요');
    });

    test('태그가 있으면 태그 뱃지 목록이 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      await seedPhoto(coupleId, uid, { tags: ['벚꽃', '카페'] });
      await seedPhoto(coupleId, uid, { tags: ['벚꽃'] });

      const photos = new PhotosPage(page);
      await photos.goto();
      await photos.switchToTab('tags');
      await expect(photos.getTagBadges()).toHaveCount(2, { timeout: 10000 });
      await expect(page.getByText('#벚꽃 (2)')).toBeVisible();
      await expect(page.getByText('#카페 (1)')).toBeVisible();
    });
  });

  test.describe('폴더 상세', () => {
    test('폴더 상세 페이지에 폴더명이 헤더에 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const folderId = await seedFolder(coupleId, uid, { name: '제주도 여행' });

      await page.goto(`/photos/folder/${folderId}`);
      await expect(page.locator('header')).toContainText('제주도 여행', { timeout: 10000 });
    });

    test('폴더에 사진이 없으면 빈 상태가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const folderId = await seedFolder(coupleId, uid, { name: '빈 폴더' });

      await page.goto(`/photos/folder/${folderId}`);
      await expect(page.getByText('이 폴더에 사진이 없어요')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('태그 상세', () => {
    test('태그 상세 페이지에 태그명이 헤더에 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      await seedPhoto(coupleId, uid, { tags: ['벚꽃'] });

      await page.goto('/photos/tag/벚꽃');
      await expect(page.locator('header')).toContainText('#벚꽃', { timeout: 10000 });
    });
  });
});
