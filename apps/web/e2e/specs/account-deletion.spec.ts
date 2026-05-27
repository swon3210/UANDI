import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { SettingsPage } from '../page-objects/SettingsPage';
import { seedPhoto } from '../helpers/emulator';

test.describe('회원탈퇴', () => {
  test('대시보드 아바타 드롭다운에서 설정 페이지로 이동할 수 있다', async ({ authedPage }) => {
    await authedPage.getByTestId('profile-menu-trigger').click();
    await authedPage.getByTestId('menu-settings').click();
    await expect(authedPage).toHaveURL(/\/settings/);
  });

  test('설정 페이지에서 프로필 정보가 표시된다', async ({ authedPage }) => {
    await authedPage.goto('/settings');
    const settings = new SettingsPage(authedPage);
    await expect(settings.header).toBeVisible();
    await expect(settings.profileName).toBeVisible();
    await expect(settings.profileEmail).toBeVisible();
    await expect(settings.deleteAccountButton).toBeVisible();
  });

  test('회원탈퇴 확인 다이얼로그에서 취소하면 설정 페이지에 머문다', async ({ authedPage }) => {
    await authedPage.goto('/settings');
    const settings = new SettingsPage(authedPage);

    await settings.deleteAccountButton.click();
    await expect(authedPage.getByTestId('delete-account-dialog')).toBeVisible();

    await authedPage.getByTestId('delete-account-cancel').click();
    await expect(authedPage).toHaveURL(/\/settings/);
  });

  test('회원탈퇴 확인 후 랜딩 페이지로 리다이렉트된다', async ({ authedPage }) => {
    await authedPage.goto('/settings');
    const settings = new SettingsPage(authedPage);

    await settings.deleteAccountButton.click();
    await expect(authedPage.getByTestId('delete-account-dialog')).toBeVisible();

    await authedPage.getByTestId('delete-account-confirm').click();
    await expect(authedPage).toHaveURL('/', { timeout: 10000 });
  });

  test('탈퇴 후 커플 공간 데이터(사진)가 보존된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;

    // 사진 시드
    await seedPhoto(coupleId, uid, { caption: '보존될 사진' });

    // 탈퇴 실행
    await page.goto('/settings');
    const settings = new SettingsPage(page);
    await settings.deleteAccountButton.click();
    await page.getByTestId('delete-account-confirm').click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Firestore에서 사진 데이터가 여전히 존재하는지 확인 (에뮬레이터 REST API)
    const res = await fetch(
      `http://localhost:8080/v1/projects/uandi-test/databases/(default)/documents/couples/${coupleId}/photos`
    );
    const data = (await res.json()) as { documents?: unknown[] };
    expect(data.documents).toBeDefined();
    expect(data.documents!.length).toBeGreaterThan(0);
  });
});
