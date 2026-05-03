import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { PhotosPage } from '../page-objects/PhotosPage';
import { seedFolder, seedPhoto } from '../helpers/emulator';

// 탭 영역 클릭 헬퍼 — 화면 우측(다음) 또는 좌측(이전) 클릭
async function clickRight(page: import('@playwright/test').Page) {
  const viewport = page.viewportSize()!;
  await page.getByTestId('slideshow-tap-zone').click({
    position: { x: viewport.width - 50, y: viewport.height / 2 },
  });
}
async function clickLeft(page: import('@playwright/test').Page) {
  await page.getByTestId('slideshow-tap-zone').click({
    position: { x: 50, y: page.viewportSize()!.height / 2 },
  });
}

test.describe('슬라이드쇼', () => {
  test.describe('진입 경로', () => {
    test('전체 탭에서 썸네일 클릭 시 클릭한 사진부터 슬라이드쇼가 시작된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      // takenAt DESC 정렬: 마지막 시드가 인덱스 0
      await seedPhoto(coupleId, uid, { caption: '세번째 시드 (인덱스 2)' });
      await seedPhoto(coupleId, uid, { caption: '두번째 시드 (인덱스 1)' });
      await seedPhoto(coupleId, uid, { caption: '첫번째 시드 (인덱스 0)' });

      const photos = new PhotosPage(page);
      await photos.goto();
      await expect(photos.getPhotoThumbnails()).toHaveCount(3, { timeout: 10000 });

      // 두 번째 썸네일(index=1) 클릭
      await photos.clickPhotoToOpenSlideshow(1);
      await expect(photos.slideshowPosition).toHaveText(/2\s*\/\s*3/);
    });

    test('폴더 페이지에서 썸네일 클릭 시 슬라이드쇼가 시작된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '여행' });
      await seedPhoto(coupleId, uid, { folderId });
      await seedPhoto(coupleId, uid, { folderId });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await expect(photos.getPhotoThumbnails()).toHaveCount(2, { timeout: 10000 });

      await photos.clickPhotoToOpenSlideshow(0);
      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*2/);
    });

    test('태그 페이지에서 썸네일 클릭 시 슬라이드쇼가 시작된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedPhoto(coupleId, uid, { tags: ['벚꽃'] });
      await seedPhoto(coupleId, uid, { tags: ['벚꽃'] });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/tag/${encodeURIComponent('벚꽃')}`);
      await expect(photos.getPhotoThumbnails()).toHaveCount(2, { timeout: 10000 });

      await photos.clickPhotoToOpenSlideshow(1);
      await expect(photos.slideshowPosition).toHaveText(/2\s*\/\s*2/);
    });

    test('폴더 [▶] 버튼은 첫 번째 사진부터 전체 사진 슬라이드쇼를 시작한다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '제주도 여행' });
      await seedPhoto(coupleId, uid, { folderId, caption: '첫번째' });
      await seedPhoto(coupleId, uid, { folderId, caption: '두번째' });
      await seedPhoto(coupleId, uid, { folderId, caption: '세번째', tags: ['벚꽃'] });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await expect(page.getByTestId('slideshow-btn')).toBeVisible();
      await page.getByTestId('slideshow-btn').click();
      await photos.slideshowContainer.waitFor({ state: 'visible' });

      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*3/);
      await expect(photos.slideshowFolderLink).toContainText('제주도 여행');
      await expect(photos.slideshowTags).toContainText('#벚꽃');
    });

    test('태그 [▶] 버튼은 첫 번째 사진부터 슬라이드쇼를 시작한다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedPhoto(coupleId, uid, { tags: ['벚꽃'] });
      await seedPhoto(coupleId, uid, { tags: ['벚꽃'] });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/tag/${encodeURIComponent('벚꽃')}`);
      await expect(page.getByTestId('slideshow-btn')).toBeVisible();
      await page.getByTestId('slideshow-btn').click();
      await photos.slideshowContainer.waitFor({ state: 'visible' });

      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*2/);
    });
  });

  test.describe('탐색', () => {
    test('좌우 탭으로 사진 전환이 동작한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '여행' });
      await seedPhoto(coupleId, uid, { folderId });
      await seedPhoto(coupleId, uid, { folderId });
      await seedPhoto(coupleId, uid, { folderId });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await page.getByTestId('slideshow-btn').click();
      await photos.slideshowContainer.waitFor({ state: 'visible' });

      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*3/);

      await clickRight(page);
      await expect(photos.slideshowPosition).toHaveText(/2\s*\/\s*3/);

      await clickLeft(page);
      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*3/);

      // 첫 번째에서 이전 → 변화 없음
      await clickLeft(page);
      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*3/);
    });

    test('마지막 사진에서 다음 탭 시 변화가 없다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '폴더' });
      await seedPhoto(coupleId, uid, { folderId });
      await seedPhoto(coupleId, uid, { folderId });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await page.getByTestId('slideshow-btn').click();
      await photos.slideshowContainer.waitFor({ state: 'visible' });

      await clickRight(page);
      await expect(photos.slideshowPosition).toHaveText(/2\s*\/\s*2/);

      await clickRight(page);
      await expect(photos.slideshowPosition).toHaveText(/2\s*\/\s*2/);
    });
  });

  test.describe('오버레이', () => {
    test('캡션 토글과 닫기 버튼이 동작한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '여행' });
      await seedPhoto(coupleId, uid, { folderId, caption: '행복한 날' });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await page.getByTestId('slideshow-btn').click();
      await photos.slideshowContainer.waitFor({ state: 'visible' });

      await expect(photos.slideshowCaption).not.toBeVisible();
      await photos.slideshowCaptionToggle.click();
      await expect(photos.slideshowCaption).toHaveText('행복한 날');

      await photos.slideshowCaptionToggle.click();
      await expect(photos.slideshowCaption).not.toBeVisible();

      await photos.slideshowCloseBtn.click();
      await expect(photos.slideshowContainer).not.toBeVisible();
    });

    test('5초 무조작 시 오버레이가 숨겨졌다가 인터랙션 시 복원된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '여행' });
      await seedPhoto(coupleId, uid, { folderId });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await page.getByTestId('slideshow-btn').click();
      await photos.slideshowContainer.waitFor({ state: 'visible' });

      await expect(page.getByTestId('slideshow-overlay')).toBeVisible();

      await page.waitForTimeout(5500);

      const opacity = await page
        .getByTestId('slideshow-overlay')
        .evaluate((el) => window.getComputedStyle(el).opacity);
      expect(Number(opacity)).toBe(0);

      await photos.slideshowContainer.click({ position: { x: 200, y: 300 } });

      await expect(async () => {
        const restoredOpacity = await page
          .getByTestId('slideshow-overlay')
          .evaluate((el) => window.getComputedStyle(el).opacity);
        expect(Number(restoredOpacity)).toBe(1);
      }).toPass({ timeout: 2000 });
    });

    test('폴더명 클릭 시 폴더 상세 페이지로 이동한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '제주도 여행' });
      await seedPhoto(coupleId, uid, { folderId });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await page.getByTestId('slideshow-btn').click();
      await photos.slideshowContainer.waitFor({ state: 'visible' });

      await photos.slideshowFolderLink.click();
      await expect(page).toHaveURL(new RegExp(`/photos/folder/${folderId}`));
    });

    test('태그 클릭 시 태그 상세 페이지로 이동한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '폴더' });
      await seedPhoto(coupleId, uid, { folderId, tags: ['벚꽃'] });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await page.getByTestId('slideshow-btn').click();
      await photos.slideshowContainer.waitFor({ state: 'visible' });

      await photos.slideshowTags.getByText('#벚꽃').click();
      await expect(page).toHaveURL(/\/photos\/tag\//);
    });
  });

  test.describe('편집', () => {
    test('캡션 수정 후 저장하면 슬라이드쇼에 반영된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '테스트 폴더' });
      await seedPhoto(coupleId, uid, { folderId, caption: '원래 캡션' });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await photos.clickPhotoToOpenSlideshow(0);

      // 캡션 토글로 표시
      await photos.slideshowCaptionToggle.click();
      await expect(photos.slideshowCaption).toContainText('원래 캡션');

      // 편집 → PhotoEditSheet
      await photos.slideshowEditBtn.click();
      const captionInput = page.getByLabel('캡션');
      await captionInput.clear();
      await captionInput.fill('수정된 캡션');
      await page.getByRole('button', { name: '저장' }).click();

      await expect(photos.slideshowCaption).toContainText('수정된 캡션', { timeout: 10000 });
    });

    test('태그 추가 후 저장하면 슬라이드쇼에 반영된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '태그 테스트' });
      await seedPhoto(coupleId, uid, { folderId, tags: ['기존태그'] });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await photos.clickPhotoToOpenSlideshow(0);

      await photos.slideshowEditBtn.click();
      const tagInput = page.getByRole('dialog').locator('input[aria-label="태그"]');
      await tagInput.fill('새태그');
      await tagInput.press('Enter');
      await page.getByRole('button', { name: '저장' }).click();

      await expect(photos.slideshowTags.locator('a')).toHaveCount(2, { timeout: 10000 });
    });
  });

  test.describe('삭제', () => {
    test('삭제 확인 후 사진이 삭제되고 다음 사진으로 이동한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '폴더' });
      await seedPhoto(coupleId, uid, { folderId, caption: '두번째' });
      await seedPhoto(coupleId, uid, { folderId, caption: '첫번째' });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await photos.clickPhotoToOpenSlideshow(0);

      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*2/);

      await photos.slideshowDeleteBtn.click();
      await expect(page.getByText('이 사진을 삭제하면 복구할 수 없어요')).toBeVisible();
      await page.getByRole('button', { name: '삭제' }).click();

      // 남은 사진 1장
      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*1/, { timeout: 10000 });
    });

    test('마지막 사진을 삭제하면 슬라이드쇼가 닫힌다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '폴더' });
      await seedPhoto(coupleId, uid, { folderId });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await photos.clickPhotoToOpenSlideshow(0);

      await photos.slideshowDeleteBtn.click();
      await page.getByRole('button', { name: '삭제' }).click();

      await expect(photos.slideshowContainer).not.toBeVisible({ timeout: 10000 });
    });

    test('삭제 취소 시 사진이 유지된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '폴더' });
      await seedPhoto(coupleId, uid, { folderId, caption: '유지될 사진' });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await photos.clickPhotoToOpenSlideshow(0);

      await photos.slideshowDeleteBtn.click();
      await expect(page.getByText('이 사진을 삭제하면 복구할 수 없어요')).toBeVisible();
      await page.getByRole('button', { name: '취소' }).click();

      await expect(photos.slideshowContainer).toBeVisible();
      await photos.slideshowCaptionToggle.click();
      await expect(photos.slideshowCaption).toContainText('유지될 사진');
    });
  });
});
