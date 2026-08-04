import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { ProfileEditPage } from '../page-objects/ProfileEditPage';
import { SettingsPage } from '../page-objects/SettingsPage';

// 프로필 편집 — 이름(displayName)/사진(photoURL)을 users/{uid} 문서에 저장한다.
// Firestore 단일 소스(Auth 미러링 없음). 저장 후 userAtom 즉시 반영 + 새로고침 후에도 유지.
// 사진은 Storage 에뮬레이터(users/{uid}/profile/avatar.*)에 올라간다.

// 1x1 투명 PNG (84 bytes) — Playwright setInputFiles로 메모리에서 첨부
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

test.describe('프로필 편집 — 이름/사진', () => {
  test('설정 화면에서 프로필 편집으로 진입할 수 있다', async ({ authedContext }) => {
    const { page } = authedContext;
    await page.goto('/settings');

    await page.getByTestId('settings-profile').click();

    await expect(page).toHaveURL(/\/settings\/profile/);
    await expect(page.getByTestId('profile-edit-header')).toBeVisible();
  });

  test('이름을 변경해 저장하면 설정 화면과 새로고침 후에도 유지된다', async ({ authedContext }) => {
    const { page } = authedContext;
    const profile = new ProfileEditPage(page);
    await profile.goto();

    await profile.setName('새로운이름');

    // 설정 화면에 즉시 반영(userAtom)
    const settings = new SettingsPage(page);
    await settings.goto();
    await expect(settings.profileName).toHaveText('새로운이름');

    // 새로고침 후에도 유지(Firestore)
    await page.reload();
    await expect(settings.profileName).toHaveText('새로운이름');
  });

  test('프로필 사진을 업로드하면 표시되고 새로고침 후에도 유지된다', async ({ authedContext }) => {
    const { page } = authedContext;
    const profile = new ProfileEditPage(page);
    await profile.goto();

    // 초기엔 사진이 없어 삭제 버튼이 숨겨져 있다.
    await expect(profile.avatarRemove).toBeHidden();

    await profile.uploadAvatar(PNG_1X1);

    // 업로드 완료 → photoURL이 채워져 삭제 버튼이 노출된다.
    await expect(profile.avatarRemove).toBeVisible();
    await expect(profile.avatar.locator('img')).toHaveAttribute('src', /.+/);

    // 새로고침 후에도 유지
    await page.reload();
    await expect(profile.avatarRemove).toBeVisible();
  });

  test('프로필 사진을 삭제하면 기본 아바타로 돌아간다', async ({ authedContext }) => {
    const { page } = authedContext;
    const profile = new ProfileEditPage(page);
    await profile.goto();

    await profile.uploadAvatar(PNG_1X1);
    await expect(profile.avatarRemove).toBeVisible();

    await profile.avatarRemove.click();

    await expect(profile.avatarRemove).toBeHidden();
    await page.reload();
    await expect(profile.avatarRemove).toBeHidden();
  });
});
