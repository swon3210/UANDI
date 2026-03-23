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
      test.skip(
        browserName !== 'chromium' || !(test.info().project.name === 'Mobile Chrome'),
        '모바일 전용 테스트'
      );
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
      await expect(photos.getEmptyStateTitle()).toHaveText('폴더를 만들어 사진을 정리해보세요');
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
