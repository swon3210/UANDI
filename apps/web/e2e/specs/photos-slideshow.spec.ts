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

    test('폴더 페이지의 마지막 썸네일 클릭 시 마지막 사진부터 슬라이드쇼가 시작된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '제주도 여행' });
      // takenAt DESC 정렬: 마지막 시드가 인덱스 0
      await seedPhoto(coupleId, uid, { folderId, caption: '세번째 (인덱스 2)', tags: ['벚꽃'] });
      await seedPhoto(coupleId, uid, { folderId, caption: '두번째 (인덱스 1)' });
      await seedPhoto(coupleId, uid, { folderId, caption: '첫번째 (인덱스 0)' });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await expect(photos.getPhotoThumbnails()).toHaveCount(3, { timeout: 10000 });

      await photos.clickPhotoToOpenSlideshow(2);
      await expect(photos.slideshowPosition).toHaveText(/3\s*\/\s*3/);
      await expect(photos.slideshowFolderLink).toContainText('제주도 여행');
      await expect(photos.slideshowTags).toContainText('#벚꽃');
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
      await photos.clickPhotoToOpenSlideshow(0);

      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*3/);

      await clickRight(page);
      await expect(photos.slideshowPosition).toHaveText(/2\s*\/\s*3/);

      await clickLeft(page);
      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*3/);

      // 첫 번째에서 이전 → 변화 없음
      await clickLeft(page);
      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*3/);
    });

    test('source=all 슬라이드쇼는 마지막 사진에서 변화가 없다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '폴더' });
      await seedPhoto(coupleId, uid, { folderId });
      await seedPhoto(coupleId, uid, { folderId });

      const photos = new PhotosPage(page);
      await photos.goto();
      await expect(photos.getPhotoThumbnails()).toHaveCount(2, { timeout: 10000 });
      await photos.clickPhotoToOpenSlideshow(0);

      await clickRight(page);
      await expect(photos.slideshowPosition).toHaveText(/2\s*\/\s*2/);

      // source=all에서는 다음 폴더로 이동하지 않고 그대로 멈춤
      await clickRight(page);
      await expect(photos.slideshowPosition).toHaveText(/2\s*\/\s*2/);
    });
  });

  test.describe('다음 폴더 자동 이동 (source=folder)', () => {
    // createdAt DESC 정렬에서 인덱스가 결정되므로 시간을 명시적으로 분리한다.
    const t = (offsetMs: number) => new Date(Date.now() - offsetMs).toISOString();

    test('마지막 사진에서 다음 액션 시 다음 형제 폴더의 첫 사진으로 이동한다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      // createdAt DESC: A(가장 최근) → B
      const folderB = await seedFolder(coupleId, uid, { name: 'B 폴더', createdAt: t(2000) });
      const folderA = await seedFolder(coupleId, uid, { name: 'A 폴더', createdAt: t(1000) });
      // A 폴더에 사진 2장
      await seedPhoto(coupleId, uid, { folderId: folderA, caption: 'A의 두번째' });
      await seedPhoto(coupleId, uid, { folderId: folderA, caption: 'A의 첫번째' });
      // B 폴더에 사진 1장
      await seedPhoto(coupleId, uid, { folderId: folderB, caption: 'B의 사진' });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderA}`);
      await expect(photos.getPhotoThumbnails()).toHaveCount(2, { timeout: 10000 });
      await photos.clickPhotoToOpenSlideshow(0);

      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*2/);
      await clickRight(page);
      await expect(photos.slideshowPosition).toHaveText(/2\s*\/\s*2/);

      // 마지막 사진에서 한 번 더 → B 폴더로 이동
      await clickRight(page);
      await expect(page).toHaveURL(new RegExp(`source=folder&id=${folderB}`), { timeout: 10000 });
      await expect(photos.slideshowFolderLink).toContainText('B 폴더');
      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*1/);
    });

    test('빈 폴더는 자동으로 건너뛰고 그 다음 폴더로 이동한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      // createdAt DESC: A → B(빈) → C
      const folderC = await seedFolder(coupleId, uid, { name: 'C 폴더', createdAt: t(3000) });
      const folderB = await seedFolder(coupleId, uid, { name: 'B 폴더 (빈)', createdAt: t(2000) });
      const folderA = await seedFolder(coupleId, uid, { name: 'A 폴더', createdAt: t(1000) });

      await seedPhoto(coupleId, uid, { folderId: folderA, caption: 'A의 사진' });
      // folderB: 사진 없음
      await seedPhoto(coupleId, uid, { folderId: folderC, caption: 'C의 사진' });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderA}`);
      await photos.clickPhotoToOpenSlideshow(0);

      // A의 다음은 B(빈) → 자동 건너뛰고 C로
      await clickRight(page);
      await expect(page).toHaveURL(new RegExp(`source=folder&id=${folderC}`), { timeout: 10000 });
      await expect(photos.slideshowFolderLink).toContainText('C 폴더');
      // folderB는 건너뛰어졌어야 함
      await expect(page).not.toHaveURL(new RegExp(`source=folder&id=${folderB}`));
    });

    test('마지막 형제 폴더에서 다음 액션 시 첫 폴더로 순환한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      // createdAt DESC: A(첫번째) → B(마지막)
      const folderB = await seedFolder(coupleId, uid, { name: 'B (마지막)', createdAt: t(2000) });
      const folderA = await seedFolder(coupleId, uid, { name: 'A (첫번째)', createdAt: t(1000) });

      await seedPhoto(coupleId, uid, { folderId: folderA });
      await seedPhoto(coupleId, uid, { folderId: folderB });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderB}`);
      await photos.clickPhotoToOpenSlideshow(0);

      // B의 다음 → 순환해서 A로
      await clickRight(page);
      await expect(page).toHaveURL(new RegExp(`source=folder&id=${folderA}`), { timeout: 10000 });
      await expect(photos.slideshowFolderLink).toContainText('A (첫번째)');
    });

    test('형제 폴더가 자기 1개뿐이면 현재 폴더 첫 사진으로 순환한다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      const folder = await seedFolder(coupleId, uid, { name: '유일한 폴더' });
      await seedPhoto(coupleId, uid, { folderId: folder, caption: '두번째' });
      await seedPhoto(coupleId, uid, { folderId: folder, caption: '첫번째' });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folder}`);
      await photos.clickPhotoToOpenSlideshow(0);
      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*2/);

      await clickRight(page);
      await expect(photos.slideshowPosition).toHaveText(/2\s*\/\s*2/);

      // 마지막에서 한 번 더 → 같은 폴더 첫 사진으로 순환
      await clickRight(page);
      await expect(photos.slideshowPosition).toHaveText(/1\s*\/\s*2/, { timeout: 10000 });
      await expect(photos.slideshowFolderLink).toContainText('유일한 폴더');
    });
  });

  test.describe('오버레이', () => {
    test('캡션 토글과 닫기 버튼이 동작한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '여행' });
      await seedPhoto(coupleId, uid, { folderId, caption: '행복한 날' });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await photos.clickPhotoToOpenSlideshow(0);

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
      await photos.clickPhotoToOpenSlideshow(0);

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
      await photos.clickPhotoToOpenSlideshow(0);

      await photos.slideshowFolderLink.click();
      await expect(page).toHaveURL(new RegExp(`/photos/folder/${folderId}`));
    });

    test('태그 클릭 시 태그 상세 페이지로 이동한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      const folderId = await seedFolder(coupleId, uid, { name: '폴더' });
      await seedPhoto(coupleId, uid, { folderId, tags: ['벚꽃'] });

      const photos = new PhotosPage(page);
      await page.goto(`/photos/folder/${folderId}`);
      await photos.clickPhotoToOpenSlideshow(0);

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
