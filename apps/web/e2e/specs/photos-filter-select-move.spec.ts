import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedFolder, seedPhoto } from '../helpers/emulator';

test.describe('사진 갤러리 3단계: 업로더 구분 + 선택 모드 + 일괄 이동', () => {
  test.describe('업로더 아바타 뱃지', () => {
    test('그리드 썸네일에 업로더 아바타가 표시된다', async ({
      twoUserAuthedContext: { page, uid1, uid2, coupleId },
    }) => {
      const folderId = await seedFolder(coupleId, uid1, { name: '제주도 여행' });
      await seedPhoto(coupleId, uid1, { folderId });
      await seedPhoto(coupleId, uid2, { folderId });

      await page.goto(`/photos/folder/${folderId}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      const avatarBadges = page.locator('[data-testid="uploader-avatar"]');
      await expect(avatarBadges).toHaveCount(2);
    });
  });

  test.describe('업로더 필터 칩 (폴더 상세)', () => {
    test('전체 필터에서 모든 사진이 표시된다', async ({
      twoUserAuthedContext: { page, uid1, uid2, coupleId },
    }) => {
      const folderId = await seedFolder(coupleId, uid1, { name: '데이트' });
      await seedPhoto(coupleId, uid1, { folderId });
      await seedPhoto(coupleId, uid2, { folderId });

      await page.goto(`/photos/folder/${folderId}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      const filterAll = page.getByTestId('filter-all');
      await expect(filterAll).toBeVisible();
      // 기본 "전체" 선택 → 모든 사진 표시
      const thumbnails = page.locator('[data-testid="photo-grid"] [data-testid^="photo-item-"]');
      await expect(thumbnails).toHaveCount(2);
    });

    test('나 필터에서 내가 올린 사진만 표시된다', async ({
      twoUserAuthedContext: { page, uid1, uid2, coupleId },
    }) => {
      const folderId = await seedFolder(coupleId, uid1, { name: '데이트' });
      await seedPhoto(coupleId, uid1, { folderId });
      await seedPhoto(coupleId, uid1, { folderId });
      await seedPhoto(coupleId, uid2, { folderId });

      await page.goto(`/photos/folder/${folderId}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      await page.getByTestId('filter-me').click();
      const thumbnails = page.locator('[data-testid="photo-grid"] [data-testid^="photo-item-"]');
      await expect(thumbnails).toHaveCount(2);
    });

    test('연인 필터에서 연인이 올린 사진만 표시된다', async ({
      twoUserAuthedContext: { page, uid1, uid2, coupleId },
    }) => {
      const folderId = await seedFolder(coupleId, uid1, { name: '데이트' });
      await seedPhoto(coupleId, uid1, { folderId });
      await seedPhoto(coupleId, uid2, { folderId });
      await seedPhoto(coupleId, uid2, { folderId });

      await page.goto(`/photos/folder/${folderId}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      await page.getByTestId('filter-partner').click();
      const thumbnails = page.locator('[data-testid="photo-grid"] [data-testid^="photo-item-"]');
      await expect(thumbnails).toHaveCount(2);
    });
  });

  test.describe('업로더 필터 칩 (태그 상세)', () => {
    test('태그 상세에서도 필터 칩이 동작한다', async ({
      twoUserAuthedContext: { page, uid1, uid2, coupleId },
    }) => {
      const folderId = await seedFolder(coupleId, uid1, { name: '여행' });
      await seedPhoto(coupleId, uid1, { folderId, tags: ['벚꽃'] });
      await seedPhoto(coupleId, uid2, { folderId, tags: ['벚꽃'] });

      await page.goto(`/photos/tag/${encodeURIComponent('벚꽃')}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      // 전체
      await expect(
        page.locator('[data-testid="photo-grid"] [data-testid^="photo-item-"]')
      ).toHaveCount(2);

      // 나
      await page.getByTestId('filter-me').click();
      await expect(
        page.locator('[data-testid="photo-grid"] [data-testid^="photo-item-"]')
      ).toHaveCount(1);

      // 연인
      await page.getByTestId('filter-partner').click();
      await expect(
        page.locator('[data-testid="photo-grid"] [data-testid^="photo-item-"]')
      ).toHaveCount(1);
    });
  });

  test.describe('선택 모드', () => {
    test('선택 모드 버튼 클릭 시 선택 모드로 전환된다', async ({
      twoUserAuthedContext: { page, uid1, coupleId },
    }) => {
      const folderId = await seedFolder(coupleId, uid1, { name: '데이트' });
      await seedPhoto(coupleId, uid1, { folderId });

      await page.goto(`/photos/folder/${folderId}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      await page.getByTestId('select-mode-btn').click();
      await expect(page.getByTestId('selection-bar')).toBeVisible();
    });

    test('사진 탭 시 선택/해제 토글된다', async ({
      twoUserAuthedContext: { page, uid1, coupleId },
    }) => {
      const folderId = await seedFolder(coupleId, uid1, { name: '데이트' });
      const photoId = await seedPhoto(coupleId, uid1, { folderId });

      await page.goto(`/photos/folder/${folderId}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      await page.getByTestId('select-mode-btn').click();

      const item = page.getByTestId(`photo-item-${photoId}`);
      await item.click();
      await expect(item.locator('[data-testid="check-overlay"]')).toBeVisible();

      // 다시 클릭하면 해제
      await item.click();
      await expect(item.locator('[data-testid="check-overlay"]')).not.toBeVisible();
    });

    test('헤더에 선택된 사진 수가 표시된다', async ({
      twoUserAuthedContext: { page, uid1, coupleId },
    }) => {
      const folderId = await seedFolder(coupleId, uid1, { name: '데이트' });
      const photoId1 = await seedPhoto(coupleId, uid1, { folderId });
      const photoId2 = await seedPhoto(coupleId, uid1, { folderId });

      await page.goto(`/photos/folder/${folderId}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      await page.getByTestId('select-mode-btn').click();
      await page.getByTestId(`photo-item-${photoId1}`).click();
      await expect(page.getByTestId('selection-count')).toContainText('1장 선택');

      await page.getByTestId(`photo-item-${photoId2}`).click();
      await expect(page.getByTestId('selection-count')).toContainText('2장 선택');
    });

    test('닫기 버튼 클릭 시 선택 모드가 해제된다', async ({
      twoUserAuthedContext: { page, uid1, coupleId },
    }) => {
      const folderId = await seedFolder(coupleId, uid1, { name: '데이트' });
      await seedPhoto(coupleId, uid1, { folderId });

      await page.goto(`/photos/folder/${folderId}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      await page.getByTestId('select-mode-btn').click();
      await expect(page.getByTestId('selection-bar')).toBeVisible();

      await page.getByTestId('exit-select-mode').click();
      await expect(page.getByTestId('selection-bar')).not.toBeVisible();
    });
  });

  test.describe('일괄 이동', () => {
    test('이동 버튼은 1장 이상 선택 시 활성화된다', async ({
      twoUserAuthedContext: { page, uid1, coupleId },
    }) => {
      const folderId = await seedFolder(coupleId, uid1, { name: '데이트' });
      const photoId = await seedPhoto(coupleId, uid1, { folderId });

      await page.goto(`/photos/folder/${folderId}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      await page.getByTestId('select-mode-btn').click();

      const moveBtn = page.getByTestId('move-photos-btn');
      await expect(moveBtn).toBeDisabled();

      await page.getByTestId(`photo-item-${photoId}`).click();
      await expect(moveBtn).toBeEnabled();
    });

    test('폴더 이동 시트에 현재 폴더가 제외된다', async ({
      twoUserAuthedContext: { page, uid1, coupleId },
    }) => {
      const folderId1 = await seedFolder(coupleId, uid1, { name: '데이트' });
      const folderId2 = await seedFolder(coupleId, uid1, { name: '기념일' });
      const photoId = await seedPhoto(coupleId, uid1, { folderId: folderId1 });

      await page.goto(`/photos/folder/${folderId1}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      await page.getByTestId('select-mode-btn').click();
      await page.getByTestId(`photo-item-${photoId}`).click();
      await page.getByTestId('move-photos-btn').click();

      // 이동 시트가 열림
      await expect(page.getByText('이동할 폴더 선택')).toBeVisible();
      // 현재 폴더 "데이트"는 목록에 없어야 함
      await expect(page.getByTestId(`move-folder-${folderId1}`)).not.toBeVisible();
      // 다른 폴더 "기념일"은 목록에 있어야 함
      await expect(page.getByTestId(`move-folder-${folderId2}`)).toBeVisible();
    });

    test('폴더 선택 후 이동하면 토스트가 표시되고 사진이 이동된다', async ({
      twoUserAuthedContext: { page, uid1, coupleId },
    }) => {
      const folderId1 = await seedFolder(coupleId, uid1, { name: '데이트' });
      const folderId2 = await seedFolder(coupleId, uid1, { name: '기념일' });
      const photoId = await seedPhoto(coupleId, uid1, { folderId: folderId1 });

      await page.goto(`/photos/folder/${folderId1}`);
      await page.waitForSelector('[data-testid="photo-grid"]');

      await page.getByTestId('select-mode-btn').click();
      await page.getByTestId(`photo-item-${photoId}`).click();
      await page.getByTestId('move-photos-btn').click();

      await page.getByTestId(`move-folder-${folderId2}`).click();
      await page.getByTestId('confirm-move-btn').click();

      // 토스트 표시
      await expect(page.getByText("1장의 사진을 '기념일'로 이동했어요")).toBeVisible();

      // 선택 모드 해제
      await expect(page.getByTestId('selection-bar')).not.toBeVisible();
    });
  });
});
