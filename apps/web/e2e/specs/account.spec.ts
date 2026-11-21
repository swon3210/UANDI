import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { SettingsPage } from '../page-objects/SettingsPage';
import { AccountPage } from '../page-objects/AccountPage';
import { ProfileEditPage } from '../page-objects/ProfileEditPage';

// 계정 관리(/settings/account) — 로그인 수단·이메일 확인, 로그아웃, 회원탈퇴를 한곳에 모은다.
// 프로필 편집(/settings/profile)은 이름·사진만 다루는 저장 폼으로 남긴다(docs/04-auth-flow.md).

test.describe('계정 관리', () => {
  test('설정 화면의 계정 행에서 계정 페이지로 진입하고, 뒤로가기로 설정에 돌아온다', async ({
    authedPage,
  }) => {
    const settings = new SettingsPage(authedPage);
    await settings.goto();
    await settings.accountLink.click();

    await expect(authedPage).toHaveURL(/\/settings\/account$/);
    const account = new AccountPage(authedPage);
    await expect(account.header).toBeVisible();

    await account.back.click();
    await expect(authedPage).toHaveURL(/\/settings$/);
  });

  test('계정 페이지에 로그인 이메일이 표시된다', async ({ authedPage }) => {
    // 설정 첫 화면의 프로필 카드에 보이는 이메일과 같은 값이어야 한다.
    const settings = new SettingsPage(authedPage);
    await settings.goto();
    const email = (await settings.profileEmail.textContent())?.trim() ?? '';
    expect(email).not.toBe('');

    const account = new AccountPage(authedPage);
    await account.goto();
    await expect(account.email).toHaveText(email);
    await expect(account.signOutButton).toBeVisible();
    await expect(account.deleteAccountButton).toBeVisible();
  });

  test('로그아웃하면 랜딩 페이지로 이동한다', async ({ authedPage }) => {
    const account = new AccountPage(authedPage);
    await account.goto();

    await account.signOutButton.click();
    await expect(authedPage).toHaveURL('/', { timeout: 10000 });
  });

  test('프로필 편집 페이지에는 회원탈퇴가 없다', async ({ authedPage }) => {
    const profile = new ProfileEditPage(authedPage);
    await profile.goto();
    await expect(profile.header).toBeVisible();
    await expect(authedPage.getByTestId('delete-account-button')).toHaveCount(0);
  });
});
