import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedFolder, seedPhoto } from '../helpers/emulator';

test.describe('슬라이드쇼', () => {
  test('폴더 상세에서 슬라이드쇼 진입 후 사진 전환이 동작한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    const folderId = await seedFolder(coupleId, uid, { name: '제주도 여행' });
    await seedPhoto(coupleId, uid, { folderId, caption: '첫번째' });
    await seedPhoto(coupleId, uid, { folderId, caption: '두번째' });
    // 마지막 시드 = takenAt DESC 기준 첫 번째 표시
    await seedPhoto(coupleId, uid, { folderId, caption: '세번째', tags: ['벚꽃'] });

    // 폴더 상세에서 슬라이드쇼 버튼 확인 및 진입
    await page.goto(`/photos/folder/${folderId}`);
    await expect(page.getByTestId('slideshow-btn')).toBeVisible();
    await page.getByTestId('slideshow-btn').click();
    await expect(page).toHaveURL(/\/photos\/slideshow\?source=folder/);

    // 첫 번째 사진 + 위치 표시
    await page.waitForSelector('[data-testid="slideshow-container"]');
    await expect(page.getByTestId('slideshow-position')).toHaveText(/1\s*\/\s*3/);

    // 폴더명, 태그 표시
    await expect(page.getByTestId('slideshow-folder-name')).toContainText('제주도 여행');
    await expect(page.getByTestId('slideshow-tags')).toContainText('#벚꽃');

    // 다음 사진으로 전환
    await page.getByTestId('slideshow-next-zone').click();
    await expect(page.getByTestId('slideshow-position')).toHaveText(/2\s*\/\s*3/);

    // 이전 사진으로 복귀
    await page.getByTestId('slideshow-prev-zone').click();
    await expect(page.getByTestId('slideshow-position')).toHaveText(/1\s*\/\s*3/);

    // 첫 번째에서 이전 → 변화 없음
    await page.getByTestId('slideshow-prev-zone').click();
    await expect(page.getByTestId('slideshow-position')).toHaveText(/1\s*\/\s*3/);
  });

  test('캡션 토글과 닫기 버튼이 동작한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    const folderId = await seedFolder(coupleId, uid, { name: '여행' });
    await seedPhoto(coupleId, uid, { folderId, caption: '행복한 날' });

    await page.goto(`/photos/slideshow?source=folder&id=${folderId}`);
    await page.waitForSelector('[data-testid="slideshow-container"]');

    // 캡션 기본 숨김 → 토글 ON
    await expect(page.getByTestId('slideshow-caption')).not.toBeVisible();
    await page.getByTestId('slideshow-caption-toggle').click();
    await expect(page.getByTestId('slideshow-caption')).toBeVisible();
    await expect(page.getByTestId('slideshow-caption')).toHaveText('행복한 날');

    // 토글 OFF
    await page.getByTestId('slideshow-caption-toggle').click();
    await expect(page.getByTestId('slideshow-caption')).not.toBeVisible();

    // 닫기
    await page.getByTestId('slideshow-close-btn').click();
    await expect(page.getByTestId('slideshow-container')).not.toBeVisible();
  });

  test('5초 무조작 시 오버레이가 숨겨졌다가 인터랙션 시 복원된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    const folderId = await seedFolder(coupleId, uid, { name: '여행' });
    await seedPhoto(coupleId, uid, { folderId });

    await page.goto(`/photos/slideshow?source=folder&id=${folderId}`);
    await page.waitForSelector('[data-testid="slideshow-container"]');

    await expect(page.getByTestId('slideshow-overlay')).toBeVisible();

    // 5.5초 대기
    await page.waitForTimeout(5500);

    const opacity = await page.getByTestId('slideshow-overlay').evaluate(
      (el) => window.getComputedStyle(el).opacity
    );
    expect(Number(opacity)).toBe(0);

    // 화면 클릭으로 복원 (300ms CSS transition 완료 대기)
    await page.getByTestId('slideshow-container').click({ position: { x: 200, y: 300 } });

    await expect(async () => {
      const restoredOpacity = await page.getByTestId('slideshow-overlay').evaluate(
        (el) => window.getComputedStyle(el).opacity
      );
      expect(Number(restoredOpacity)).toBe(1);
    }).toPass({ timeout: 2000 });
  });

  test('태그 상세에서 슬라이드쇼 진입이 동작한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    const folderId = await seedFolder(coupleId, uid, { name: '폴더' });
    await seedPhoto(coupleId, uid, { folderId, tags: ['벚꽃'] });
    await seedPhoto(coupleId, uid, { folderId, tags: ['벚꽃'] });

    await page.goto(`/photos/tag/${encodeURIComponent('벚꽃')}`);
    await expect(page.getByTestId('slideshow-btn')).toBeVisible();
    await page.getByTestId('slideshow-btn').click();

    await expect(page).toHaveURL(/\/photos\/slideshow\?source=tag/);
    await page.waitForSelector('[data-testid="slideshow-container"]');
    await expect(page.getByTestId('slideshow-position')).toHaveText(/1\s*\/\s*2/);
  });
});
