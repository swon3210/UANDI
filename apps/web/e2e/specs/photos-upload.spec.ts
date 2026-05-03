import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { PhotosPage } from '../page-objects/PhotosPage';
import { seedFolder } from '../helpers/emulator';

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
