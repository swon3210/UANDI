import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedFolder, seedPhoto } from '../helpers/emulator';

test.describe('사진 폴더 중첩', () => {
  test.describe('하위 폴더 탐색', () => {
    test('루트 폴더 상세에 하위 폴더 섹션이 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const rootId = await seedFolder(coupleId, uid, { name: '여행' });
      await seedFolder(coupleId, uid, {
        name: '일본',
        parentFolderId: rootId,
        depth: 1,
        path: [rootId],
      });
      await seedFolder(coupleId, uid, {
        name: '제주',
        parentFolderId: rootId,
        depth: 1,
        path: [rootId],
      });

      await page.goto(`/photos/folder/${rootId}`);

      const section = page.getByTestId('subfolder-section');
      await expect(section).toBeVisible({ timeout: 10000 });
      await expect(section.locator('[data-testid^="folder-card-"]')).toHaveCount(2);
    });

    test('폴더 탭에는 루트 폴더만 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const rootId = await seedFolder(coupleId, uid, { name: '여행' });
      await seedFolder(coupleId, uid, {
        name: '일본',
        parentFolderId: rootId,
        depth: 1,
        path: [rootId],
      });

      await page.goto('/photos');
      await page.getByTestId('tab-folders').click();

      // 루트 폴더 1개만 표시 (하위 "일본"은 제외)
      await expect(page.locator('[data-testid^="folder-card-"]')).toHaveCount(1, {
        timeout: 10000,
      });
    });

    test('Breadcrumb으로 상위 폴더를 되짚을 수 있다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const rootId = await seedFolder(coupleId, uid, { name: '여행' });
      const childId = await seedFolder(coupleId, uid, {
        name: '일본',
        parentFolderId: rootId,
        depth: 1,
        path: [rootId],
      });

      await page.goto(`/photos/folder/${childId}`);

      const breadcrumb = page.getByTestId('folder-breadcrumb');
      await expect(breadcrumb).toBeVisible({ timeout: 10000 });
      await expect(breadcrumb).toContainText('여행');

      await breadcrumb.getByRole('link', { name: '여행' }).click();
      await page.waitForURL(`**/photos/folder/${rootId}`);
    });
  });

  test.describe('하위 폴더 생성', () => {
    test('폴더 상세에서 하위 폴더를 만들 수 있다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const rootId = await seedFolder(coupleId, uid, { name: '여행' });

      await page.goto(`/photos/folder/${rootId}`);

      await page.getByTestId('create-subfolder-btn').click();
      await page.getByLabel('폴더 이름').fill('일본');
      await page.getByRole('button', { name: '만들기' }).click();

      // 새 하위 폴더 카드가 하위 섹션에 나타남
      const section = page.getByTestId('subfolder-section');
      await expect(section.getByText('일본')).toBeVisible({ timeout: 10000 });
    });

    test('depth 4 폴더에서는 하위 폴더 만들기 버튼이 비활성화된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      // depth 0~4 까지 5단계 체인 생성
      const f0 = await seedFolder(coupleId, uid, { name: 'L0' });
      const f1 = await seedFolder(coupleId, uid, {
        name: 'L1',
        parentFolderId: f0,
        depth: 1,
        path: [f0],
      });
      const f2 = await seedFolder(coupleId, uid, {
        name: 'L2',
        parentFolderId: f1,
        depth: 2,
        path: [f0, f1],
      });
      const f3 = await seedFolder(coupleId, uid, {
        name: 'L3',
        parentFolderId: f2,
        depth: 3,
        path: [f0, f1, f2],
      });
      const f4 = await seedFolder(coupleId, uid, {
        name: 'L4',
        parentFolderId: f3,
        depth: 4,
        path: [f0, f1, f2, f3],
      });

      await page.goto(`/photos/folder/${f4}`);

      const btn = page.getByTestId('create-subfolder-btn');
      await expect(btn).toBeVisible({ timeout: 10000 });
      await expect(btn).toBeDisabled();
    });
  });

  test.describe('재귀 삭제', () => {
    test('하위 폴더와 사진이 있는 폴더 삭제 시 개수가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;

      const rootId = await seedFolder(coupleId, uid, { name: '여행' });
      const childId = await seedFolder(coupleId, uid, {
        name: '일본',
        parentFolderId: rootId,
        depth: 1,
        path: [rootId],
      });
      await seedFolder(coupleId, uid, {
        name: '도쿄',
        parentFolderId: childId,
        depth: 2,
        path: [rootId, childId],
      });
      await seedPhoto(coupleId, uid, { folderId: rootId });
      await seedPhoto(coupleId, uid, { folderId: childId });
      await seedPhoto(coupleId, uid, { folderId: childId });

      await page.goto(`/photos/folder/${rootId}`);

      await page.getByTestId('folder-menu-btn').click();
      await page.getByRole('button', { name: '폴더 삭제' }).click();

      const confirm = page.getByTestId('delete-folder-confirm');
      await expect(confirm).toBeVisible({ timeout: 10000 });
      await expect(confirm).toContainText('하위 폴더 2개');
      await expect(confirm).toContainText('사진 3장');

      await confirm.getByRole('button', { name: '삭제' }).click();

      // 갤러리 메인으로 돌아오고 폴더가 사라짐
      await page.waitForURL('**/photos**');
      await page.getByTestId('tab-folders').click();
      await expect(page.getByText('폴더를 만들어 사진을 정리해보세요')).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
