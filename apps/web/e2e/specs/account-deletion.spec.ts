import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { SettingsPage } from '../page-objects/SettingsPage';
import { AccountPage } from '../page-objects/AccountPage';
import {
  seedPhoto,
  lookupAuthUserByEmail,
  userDocumentExists,
  getCoupleMemberUids,
} from '../helpers/emulator';

// 회원탈퇴는 서버 API(/api/account/delete, Admin SDK)가 처리한다 — docs/04-auth-flow.md 「회원탈퇴 처리」.
// 클라이언트에서 deleteUser()를 부르면 로그인이 오래된 계정은 재인증(팝업)이 필요한데,
// 인앱 WebView에서는 팝업이 열리지 않아 탈퇴가 실패하고 데이터만 반쪽 지워지는 사고가 있었다(2026-11).

test.describe('회원탈퇴', () => {
  test('대시보드 아바타 드롭다운에서 설정 페이지로 이동할 수 있다', async ({ authedPage }) => {
    await authedPage.getByTestId('profile-menu-trigger').click();
    await authedPage.getByTestId('menu-settings').click();
    await expect(authedPage).toHaveURL(/\/settings/);
  });

  test('설정 페이지에서 프로필 정보가 표시되고, 회원탈퇴는 계정 페이지에 있다', async ({
    authedPage,
  }) => {
    await authedPage.goto('/settings');
    const settings = new SettingsPage(authedPage);
    await expect(settings.header).toBeVisible();
    await expect(settings.profileName).toBeVisible();
    await expect(settings.profileEmail).toBeVisible();
    // 설정 첫 화면에는 회원탈퇴가 없다
    await expect(settings.deleteAccountButton).toHaveCount(0);

    await settings.gotoAccount();
    await expect(settings.deleteAccountButton).toBeVisible();
  });

  test('회원탈퇴 확인 다이얼로그에서 취소하면 계정 페이지에 머문다', async ({ authedPage }) => {
    const account = new AccountPage(authedPage);
    await account.goto();

    await account.deleteAccountButton.click();
    await expect(account.deleteDialog).toBeVisible();

    await account.deleteCancel.click();
    await expect(authedPage).toHaveURL(/\/settings\/account/);
  });

  test('회원탈퇴 확인 후 랜딩 페이지로 리다이렉트된다', async ({ authedPage }) => {
    const account = new AccountPage(authedPage);
    await account.goto();

    await account.deleteAccountButton.click();
    await expect(account.deleteDialog).toBeVisible();

    await account.deleteConfirm.click();
    await expect(authedPage).toHaveURL('/', { timeout: 10000 });
  });

  test('탈퇴하면 Auth 계정·users 문서가 삭제되고 커플 멤버에서 빠진다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    expect(await lookupAuthUserByEmail('user1@test.com')).not.toBeNull();
    expect(await getCoupleMemberUids(coupleId)).toContain(uid);

    const account = new AccountPage(page);
    await account.goto();
    await account.deleteAccountButton.click();
    await account.deleteConfirm.click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    await expect.poll(() => lookupAuthUserByEmail('user1@test.com')).toBeNull();
    expect(await userDocumentExists(uid)).toBe(false);
    const members = await getCoupleMemberUids(coupleId);
    expect(members).not.toContain(uid);
    expect(members.length).toBe(1); // 짝꿍은 그대로 남는다
  });

  test('커플 연결 전(온보딩) 사용자도 회원탈퇴할 수 있다', async ({ noCoupleAuthedPage }) => {
    // 탈퇴가 중간에 실패해 users 문서만 지워진 사용자는 다음 실행 때 온보딩에 도착한다.
    // 거기서도 탈퇴할 수 있어야 스스로 정리할 수 있다.
    const page = noCoupleAuthedPage;
    await page.getByTestId('onboarding-delete-account').click();
    await expect(page.getByTestId('delete-account-dialog')).toBeVisible();
    await page.getByTestId('delete-account-confirm').click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect.poll(() => lookupAuthUserByEmail('user1@test.com')).toBeNull();
  });

  test('온보딩에서 로그아웃하면 랜딩으로 돌아간다', async ({ noCoupleAuthedPage }) => {
    const page = noCoupleAuthedPage;
    await page.getByTestId('onboarding-sign-out').click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('탈퇴 후 커플 공간 데이터(사진)가 보존된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;

    // 사진 시드
    await seedPhoto(coupleId, uid, { caption: '보존될 사진' });

    // 탈퇴 실행
    const account = new AccountPage(page);
    await account.goto();
    await account.deleteAccountButton.click();
    await account.deleteConfirm.click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Firestore에서 사진 데이터가 여전히 존재하는지 확인 (에뮬레이터 REST API)
    // 규칙이 적용된 에뮬레이터라 owner 토큰이 있어야 읽힌다(다른 헬퍼와 동일)
    const res = await fetch(
      `http://localhost:8080/v1/projects/uandi-test/databases/(default)/documents/couples/${coupleId}/photos`,
      { headers: { Authorization: 'Bearer owner' } }
    );
    const data = (await res.json()) as { documents?: unknown[] };
    expect(data.documents).toBeDefined();
    expect(data.documents!.length).toBeGreaterThan(0);
  });
});
