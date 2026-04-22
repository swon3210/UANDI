import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { PhotosPage } from '../page-objects/PhotosPage';
import { seedFolder } from '../helpers/emulator';

test.describe('사진 업로드 - 폴더 Combobox', () => {
  test('검색어로 폴더를 필터링해 선택할 수 있다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;

    await seedFolder(coupleId, uid, { name: '제주도 여행' });
    await seedFolder(coupleId, uid, { name: '부산 여행' });
    await seedFolder(coupleId, uid, { name: '일상' });

    const photos = new PhotosPage(page);
    await photos.goto();
    await expect(photos.uploadBtn).toHaveAttribute('data-auth-ready', 'true', { timeout: 10000 });
    await photos.uploadBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const trigger = page.getByTestId('folder-combobox-trigger');
    await trigger.click();

    const input = page.getByTestId('folder-combobox-input');
    await input.fill('여행');

    await expect(page.getByRole('option', { name: '제주도 여행' })).toBeVisible();
    await expect(page.getByRole('option', { name: '부산 여행' })).toBeVisible();
    await expect(page.getByRole('option', { name: '일상' })).not.toBeVisible();

    await page.getByRole('option', { name: '제주도 여행' }).click();
    await expect(trigger).toContainText('제주도 여행');
  });

  test('일치하는 폴더가 없으면 검색어로 새 폴더를 만들 수 있다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;

    await seedFolder(coupleId, uid, { name: '제주도 여행' });

    const photos = new PhotosPage(page);
    await photos.goto();
    await expect(photos.uploadBtn).toHaveAttribute('data-auth-ready', 'true', { timeout: 10000 });
    await photos.uploadBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const trigger = page.getByTestId('folder-combobox-trigger');
    await trigger.click();

    const input = page.getByTestId('folder-combobox-input');
    await input.fill('새 폴더 이름');

    const createOption = page.getByTestId('folder-combobox-create');
    await expect(createOption).toBeVisible();
    await expect(createOption).toContainText("'새 폴더 이름' 폴더 만들기");

    await createOption.click();

    // 생성된 폴더가 자동 선택되어 트리거에 표시된다
    await expect(trigger).toContainText('새 폴더 이름', { timeout: 10000 });
  });

  test('폴더가 10개 이상이어도 검색으로 한 번에 찾을 수 있다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;

    const names = [
      '2026 결혼기념일 홍콩',
      '2026 꽃놀이',
      '2025 제주도',
      '2025 부산',
      '일상',
      '결혼식 본식',
      '결혼식 스냅',
      '신혼여행',
      '친구 모임',
      '가족 여행',
      '반려묘',
      '맛집 기록',
    ];
    for (const name of names) {
      await seedFolder(coupleId, uid, { name });
    }

    const photos = new PhotosPage(page);
    await photos.goto();
    await expect(photos.uploadBtn).toHaveAttribute('data-auth-ready', 'true', { timeout: 10000 });
    await photos.uploadBtn.click();

    const trigger = page.getByTestId('folder-combobox-trigger');
    await trigger.click();

    await page.getByTestId('folder-combobox-input').fill('홍콩');
    await page.getByRole('option', { name: '2026 결혼기념일 홍콩' }).click();

    await expect(trigger).toContainText('2026 결혼기념일 홍콩');
  });
});
