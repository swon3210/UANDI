import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedFolder } from '../helpers/emulator';

test.describe('사진 AI 태그 제안', () => {
  test('사진 선택 후 AI 태그 제안 버튼이 표시된다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedFolder(coupleId, uid, { name: '여행' });

    await page.goto('/photos');
    await page.waitForSelector('[data-testid="photos-header"]');

    // 업로드 Sheet 열기
    await page.getByTestId('upload-btn').click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();

    // AI 태그 제안 버튼은 사진 선택 전에는 비활성화
    const aiTagBtn = page.getByTestId('ai-suggest-tags-btn');
    await expect(aiTagBtn).toBeDisabled();
  });

  test('AI 태그 제안 버튼 클릭 시 태그 칩이 표시된다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedFolder(coupleId, uid, { name: '여행' });

    await page.goto('/photos');
    await page.waitForSelector('[data-testid="photos-header"]');

    await page.getByTestId('upload-btn').click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();

    // 테스트용 이미지 파일 생성 및 선택
    const fileInput = sheet.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(100),
    });

    // 사진 선택 후 AI 태그 제안 버튼이 활성화됨
    const aiTagBtn = page.getByTestId('ai-suggest-tags-btn');
    await expect(aiTagBtn).toBeEnabled({ timeout: 3000 });
    await aiTagBtn.click();

    // mock 응답: ['카페', '디저트', '데이트']
    const tagChips = page.getByTestId('ai-suggested-tag');
    await expect(tagChips).toHaveCount(3, { timeout: 5000 });
  });

  test('AI 제안 태그 칩을 클릭하면 태그 목록에 추가된다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedFolder(coupleId, uid, { name: '여행' });

    await page.goto('/photos');
    await page.waitForSelector('[data-testid="photos-header"]');

    await page.getByTestId('upload-btn').click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();

    const fileInput = sheet.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(100),
    });

    const aiTagBtn = page.getByTestId('ai-suggest-tags-btn');
    await expect(aiTagBtn).toBeEnabled({ timeout: 3000 });
    await aiTagBtn.click();
    await page.waitForSelector('[data-testid="ai-suggested-tag"]');

    // 첫 번째 제안 태그 클릭
    const firstTag = page.getByTestId('ai-suggested-tag').first();
    await firstTag.click();

    // 태그 목록에 추가됨 (Badge로 표시)
    const tagBadge = sheet.locator('[data-testid="ai-suggested-tag"].bg-primary').first();
    await expect(tagBadge).toBeVisible();
  });
});
