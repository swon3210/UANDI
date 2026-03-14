import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { PhotosPage } from '../page-objects/PhotosPage';
import { seedPhoto, seedFolder } from '../helpers/emulator';

test.describe('사진 업로드 + 상세 (2단계)', () => {
  test.describe('사진 상세 페이지', () => {
    test('사진 클릭 시 상세 페이지에 이미지와 메타 정보가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const folderId = await seedFolder(coupleId, uid, { name: '제주도 여행' });
      const photoId = await seedPhoto(coupleId, uid, {
        folderId,
        tags: ['벚꽃', '바다'],
        caption: '이 날 정말 행복했어',
      });

      const photos = new PhotosPage(page);
      await photos.gotoDetail(photoId);

      // 이미지가 표시된다
      await expect(photos.detailImage).toBeVisible({ timeout: 10000 });

      // 폴더명이 표시된다
      await expect(photos.detailFolderLink).toContainText('제주도 여행');

      // 태그가 표시된다
      const tagLinks = photos.getDetailTagLinks();
      await expect(tagLinks).toHaveCount(2, { timeout: 10000 });

      // 캡션이 표시된다
      await expect(photos.detailCaption).toContainText('이 날 정말 행복했어');
    });

    test('폴더명 클릭 시 해당 폴더 상세로 이동한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const folderId = await seedFolder(coupleId, uid, { name: '일상 사진' });
      const photoId = await seedPhoto(coupleId, uid, { folderId });

      const photos = new PhotosPage(page);
      await photos.gotoDetail(photoId);
      await expect(photos.detailFolderLink).toBeVisible({ timeout: 10000 });
      await photos.detailFolderLink.click();
      await page.waitForURL(`**/photos/folder/${folderId}`);
    });

    test('태그 클릭 시 해당 태그 상세로 이동한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const photoId = await seedPhoto(coupleId, uid, { tags: ['벚꽃'] });

      const photos = new PhotosPage(page);
      await photos.gotoDetail(photoId);

      const tagLink = photos.getDetailTagLinks().first();
      await expect(tagLink).toBeVisible({ timeout: 10000 });
      await tagLink.click();
      await page.waitForURL('**/photos/tag/**');
    });

    test('캡션이 없으면 캡션 영역이 숨겨진다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const photoId = await seedPhoto(coupleId, uid, { caption: '' });

      const photos = new PhotosPage(page);
      await photos.gotoDetail(photoId);
      await expect(photos.detailImage).toBeVisible({ timeout: 10000 });
      await expect(photos.detailCaption).not.toBeVisible();
    });

    test('업로더 정보(이름)가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const folderId = await seedFolder(coupleId, uid, { name: '테스트 폴더' });
      const photoId = await seedPhoto(coupleId, uid, { folderId });

      const photos = new PhotosPage(page);
      await photos.gotoDetail(photoId);
      await expect(photos.detailImage).toBeVisible({ timeout: 10000 });

      // 업로더 이름이 표시된다
      const uploaderEl = page.getByTestId('photo-uploader');
      await expect(uploaderEl).toBeVisible({ timeout: 10000 });
      await expect(uploaderEl).toContainText('올림');
    });
  });

  test.describe('사진 편집', () => {
    test('캡션 수정 후 저장하면 반영된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const folderId = await seedFolder(coupleId, uid, { name: '테스트 폴더' });
      const photoId = await seedPhoto(coupleId, uid, {
        folderId,
        caption: '원래 캡션',
      });

      const photos = new PhotosPage(page);
      await photos.gotoDetail(photoId);
      await expect(photos.detailImage).toBeVisible({ timeout: 10000 });

      // 더보기 메뉴 열기
      await photos.moreMenuBtn.click();
      await page.getByRole('menuitem', { name: '편집' }).click();

      // 캡션 수정
      const captionInput = page.getByLabel('캡션');
      await captionInput.clear();
      await captionInput.fill('수정된 캡션');
      await page.getByRole('button', { name: '저장' }).click();

      // 수정된 캡션이 반영
      await expect(photos.detailCaption).toContainText('수정된 캡션', { timeout: 10000 });
    });

    test('폴더 변경 후 저장하면 반영된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const folder1 = await seedFolder(coupleId, uid, { name: '폴더1' });
      const folder2 = await seedFolder(coupleId, uid, { name: '폴더2' });
      const photoId = await seedPhoto(coupleId, uid, { folderId: folder1 });

      const photos = new PhotosPage(page);
      await photos.gotoDetail(photoId);
      await expect(photos.detailFolderLink).toContainText('폴더1', { timeout: 10000 });

      // 더보기 → 편집
      await photos.moreMenuBtn.click();
      await page.getByRole('menuitem', { name: '편집' }).click();

      // 폴더 변경
      await page.getByLabel('폴더').click();
      await page.getByRole('option', { name: '폴더2' }).click();
      await page.getByRole('button', { name: '저장' }).click();

      // 변경된 폴더명 반영
      await expect(photos.detailFolderLink).toContainText('폴더2', { timeout: 10000 });
    });

    test('태그 추가 후 저장하면 반영된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const folderId = await seedFolder(coupleId, uid, { name: '태그 테스트' });
      const photoId = await seedPhoto(coupleId, uid, {
        folderId,
        tags: ['기존태그'],
      });

      const photos = new PhotosPage(page);
      await photos.gotoDetail(photoId);
      await expect(photos.detailImage).toBeVisible({ timeout: 10000 });

      // 더보기 → 편집
      await photos.moreMenuBtn.click();
      await page.getByRole('menuitem', { name: '편집' }).click();

      // 새 태그 추가 (TagInput의 내부 input, aria-label="태그")
      const tagInput = page.getByRole('dialog').locator('input[aria-label="태그"]');
      await tagInput.fill('새태그');
      await tagInput.press('Enter');
      await page.getByRole('button', { name: '저장' }).click();

      // 태그가 2개로 늘어남
      const tagLinks = photos.getDetailTagLinks();
      await expect(tagLinks).toHaveCount(2, { timeout: 10000 });
    });
  });

  test.describe('사진 삭제', () => {
    test('삭제 확인 후 사진이 삭제되고 갤러리로 이동한다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const photoId = await seedPhoto(coupleId, uid, {});

      const photos = new PhotosPage(page);
      await photos.gotoDetail(photoId);
      await expect(photos.detailImage).toBeVisible({ timeout: 10000 });

      // 더보기 → 삭제
      await photos.moreMenuBtn.click();
      await page.getByRole('menuitem', { name: '삭제' }).click();

      // 확인 다이얼로그
      await expect(page.getByText('이 사진을 삭제하면 복구할 수 없어요')).toBeVisible();
      await page.getByRole('button', { name: '삭제' }).click();

      // 갤러리로 이동
      await page.waitForURL('**/photos', { timeout: 10000 });
    });

    test('삭제 취소 시 사진이 유지된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const folderId = await seedFolder(coupleId, uid, { name: '삭제 취소 테스트' });
      const photoId = await seedPhoto(coupleId, uid, { folderId, caption: '삭제하지 않을 사진' });

      const photos = new PhotosPage(page);
      await photos.gotoDetail(photoId);
      await expect(photos.detailImage).toBeVisible({ timeout: 10000 });

      // 더보기 → 삭제
      await photos.moreMenuBtn.click();
      await page.getByRole('menuitem', { name: '삭제' }).click();

      // 확인 다이얼로그에서 취소
      await expect(page.getByText('이 사진을 삭제하면 복구할 수 없어요')).toBeVisible();
      await page.getByRole('button', { name: '취소' }).click();

      // 사진이 여전히 표시됨
      await expect(photos.detailImage).toBeVisible();
      await expect(photos.detailCaption).toContainText('삭제하지 않을 사진');
    });
  });

  test.describe('사진 업로드', () => {
    test('업로드 버튼 클릭 시 업로드 시트가 열린다', async ({ authedContext }) => {
      const { page } = authedContext;
      const photos = new PhotosPage(page);
      await photos.goto();
      // useAuth 완료 대기 (coupleId가 로드되어야 overlay가 동작)
      await expect(photos.uploadBtn).toHaveAttribute('data-auth-ready', 'true', { timeout: 10000 });
      await photos.uploadBtn.click();

      // 시트(dialog)가 열린다
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });
      await expect(dialog.getByText('사진 추가')).toBeVisible();
    });

    test('폴더 미선택 시 업로드 버튼이 비활성화된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      await seedFolder(coupleId, uid, { name: '테스트 폴더' });

      const photos = new PhotosPage(page);
      await photos.goto();
      await expect(photos.uploadBtn).toHaveAttribute('data-auth-ready', 'true', { timeout: 10000 });
      await photos.uploadBtn.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10000 });
      // 폴더 미선택 + 이미지 미선택 상태에서 업로드 버튼 비활성화
      await expect(photos.uploadSubmitBtn).toBeDisabled();
    });
  });
});
