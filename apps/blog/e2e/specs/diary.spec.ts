import { expect, test } from '../fixtures/owner.fixture';
import {
  clearDiaryEntries,
  createTempPng,
  ensureTestUser,
  seedDiaryEntries,
  STRANGER_EMAIL,
} from '../helpers/emulator';
import { signInAsOwner } from '../fixtures/owner.fixture';

/** 발행 후 이동하는 글 주소 — /diary/write가 걸리지 않게 한다. */
const ENTRY_URL = /\/diary\/(?!write$)[^/]+$/;

/**
 * 명세: docs/blog/07-diary.md
 * /diary는 블로그 어디에도 링크하지 않는 비공개 일기다.
 * 목록은 주인만, 개별 글은 URL을 아는 사람만, 쓰기·수정·삭제는 주인만.
 */
test.describe('일기 (/diary)', () => {
  test('블로그 어디에도 일기 진입점이 없다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('a[href^="/diary"]')).toHaveCount(0);

    await page.goto('/about');
    await expect(page.locator('a[href^="/diary"]')).toHaveCount(0);
  });

  test('로그아웃 상태에서는 목록 대신 로그인 안내가 보인다', async ({ page }) => {
    await clearDiaryEntries();
    await page.goto('/diary');
    await expect(page.getByRole('button', { name: 'Google로 로그인' })).toBeVisible();
    await expect(page.getByRole('link', { name: '새 일기' })).toHaveCount(0);
  });

  test('일기 페이지는 검색 엔진 색인을 막는다', async ({ page }) => {
    await page.goto('/diary');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('주인은 일기를 쓰고, 고치고, 지울 수 있다', async ({ ownerPage }) => {
    await expect(ownerPage.getByRole('link', { name: '새 일기' })).toBeVisible();
    await ownerPage.getByRole('link', { name: '새 일기' }).click();
    await ownerPage.waitForURL('**/diary/write');

    await ownerPage.getByPlaceholder('제목을 입력하세요').fill('비 오는 화요일');
    await ownerPage.locator('.ProseMirror').click();
    await ownerPage.keyboard.type('우산을 안 챙겼다.');
    await ownerPage.getByRole('button', { name: '발행' }).click();

    // 발행 → 읽기 화면
    await ownerPage.waitForURL(ENTRY_URL);
    await expect(ownerPage.getByRole('heading', { name: '비 오는 화요일' })).toBeVisible();
    await expect(ownerPage.getByText('우산을 안 챙겼다.')).toBeVisible();
    const entryUrl = ownerPage.url();

    // 수정
    await ownerPage.getByRole('link', { name: '수정' }).click();
    await ownerPage.waitForURL('**/edit');
    await expect(ownerPage.getByPlaceholder('제목을 입력하세요')).toHaveValue('비 오는 화요일');
    await ownerPage.getByPlaceholder('제목을 입력하세요').fill('비 오는 화요일 (고침)');
    await ownerPage.getByRole('button', { name: '수정 완료' }).click();

    await ownerPage.waitForURL(entryUrl);
    await expect(ownerPage.getByRole('heading', { name: '비 오는 화요일 (고침)' })).toBeVisible();
    await expect(ownerPage.getByText('수정됨')).toBeVisible();

    // 목록 반영
    await ownerPage.getByRole('link', { name: '목록' }).click();
    await ownerPage.waitForURL('**/diary');
    await expect(ownerPage.getByRole('heading', { name: '비 오는 화요일 (고침)' })).toBeVisible();

    // 삭제
    await ownerPage.getByRole('heading', { name: '비 오는 화요일 (고침)' }).click();
    await ownerPage.waitForURL(ENTRY_URL);
    await ownerPage.getByRole('button', { name: '삭제' }).click();
    await ownerPage.getByRole('dialog').getByRole('button', { name: '삭제' }).click();

    await ownerPage.waitForURL('**/diary');
    await expect(ownerPage.getByText('아직 쓴 일기가 없습니다.')).toBeVisible();
  });

  test('서식(소제목·굵게·인용)과 이미지가 저장되고 읽기 화면에 그대로 보인다', async ({
    ownerPage,
  }) => {
    await ownerPage.goto('/diary/write');
    await ownerPage.getByPlaceholder('제목을 입력하세요').fill('서식 확인');

    await ownerPage.locator('.ProseMirror').click();
    await ownerPage.keyboard.type('오늘의 기록');
    await ownerPage.keyboard.down('Shift');
    await ownerPage.keyboard.press('Home');
    await ownerPage.keyboard.up('Shift');
    await ownerPage.getByRole('button', { name: '제목', exact: true }).click();
    await expect(ownerPage.locator('.ProseMirror h2')).toHaveText('오늘의 기록');

    await ownerPage.keyboard.press('End');
    await ownerPage.keyboard.press('Enter');
    await ownerPage.keyboard.type('평범한 문단.');
    await ownerPage.keyboard.press('Enter');

    // 빈 줄 삽입 메뉴 → 인용
    await ownerPage.getByRole('button', { name: '인용' }).first().click();
    await ownerPage.keyboard.type('인용한 문장.');
    await expect(ownerPage.locator('.ProseMirror blockquote')).toContainText('인용한 문장.');

    // 빈 줄 삽입 메뉴 → 사진 (Storage 업로드)
    await ownerPage.keyboard.press('Enter');
    await ownerPage.keyboard.press('Enter');
    await ownerPage.locator('input[type=file]').first().setInputFiles(createTempPng());
    await expect(ownerPage.locator('.ProseMirror img')).toHaveCount(1, { timeout: 20000 });

    await ownerPage.getByRole('button', { name: '발행' }).click();
    await ownerPage.waitForURL(ENTRY_URL);

    await expect(ownerPage.locator('.diary-prose h2')).toHaveText('오늘의 기록');
    await expect(ownerPage.locator('.diary-prose blockquote')).toContainText('인용한 문장.');
    await expect(ownerPage.locator('.diary-prose img')).toHaveCount(1);
  });

  test('링크를 받은 방문자는 글을 읽을 수 있지만 고치거나 목록을 볼 수 없다', async ({
    ownerPage,
    browser,
  }) => {
    await ownerPage.goto('/diary/write');
    await ownerPage.getByPlaceholder('제목을 입력하세요').fill('링크로 공유한 일기');
    await ownerPage.locator('.ProseMirror').click();
    await ownerPage.keyboard.type('링크를 아는 사람만 읽는다.');
    await ownerPage.getByRole('button', { name: '발행' }).click();
    await ownerPage.waitForURL(ENTRY_URL);
    const entryUrl = ownerPage.url();

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    await guestPage.goto(entryUrl);
    await expect(guestPage.getByRole('heading', { name: '링크로 공유한 일기' })).toBeVisible();
    await expect(guestPage.getByText('링크를 아는 사람만 읽는다.')).toBeVisible();
    await expect(guestPage.getByRole('link', { name: '수정' })).toHaveCount(0);
    await expect(guestPage.getByRole('button', { name: '삭제' })).toHaveCount(0);

    await guestPage.goto('/diary');
    await expect(guestPage.getByRole('button', { name: 'Google로 로그인' })).toBeVisible();
    await expect(guestPage.getByText('링크로 공유한 일기')).toHaveCount(0);

    await guestContext.close();
  });

  test('주인이 아닌 계정으로 로그인하면 목록도 글쓰기도 막힌다', async ({ page }) => {
    await clearDiaryEntries();
    await ensureTestUser(STRANGER_EMAIL);
    await signInAsOwner(page, STRANGER_EMAIL);

    await expect(page.getByText('이 페이지를 볼 수 있는 계정이 아닙니다.')).toBeVisible();

    await page.goto('/diary/write');
    await expect(page.getByText('글을 쓸 수 있는 계정이 아닙니다.')).toBeVisible();
    await expect(page.getByPlaceholder('제목을 입력하세요')).toHaveCount(0);
  });

  test('목록은 최신순 10개까지 보여주고 더 보기로 이어 읽는다', async ({ ownerPage, ownerUid }) => {
    await seedDiaryEntries(ownerUid, 12);
    await ownerPage.goto('/diary');

    await expect(ownerPage.locator('ul li')).toHaveCount(10);
    // createdAt 내림차순 — 12번이 가장 최신
    await expect(ownerPage.locator('ul li').first()).toContainText('씨앗 일기 12');

    await ownerPage.getByRole('button', { name: '더 보기' }).click();
    await expect(ownerPage.locator('ul li')).toHaveCount(12);
    await expect(ownerPage.getByRole('button', { name: '더 보기' })).toHaveCount(0);
    await expect(ownerPage.locator('ul li').last()).toContainText('씨앗 일기 1');
  });
});
