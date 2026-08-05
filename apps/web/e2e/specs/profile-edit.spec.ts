import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { ProfileEditPage } from '../page-objects/ProfileEditPage';
import { SettingsPage } from '../page-objects/SettingsPage';

// 프로필 편집 — 이름(displayName)/사진(photoURL)을 users/{uid} 문서에 저장한다.
// 사진은 선택 후 1:1 크롭 다이얼로그를 거쳐 정사각으로 잘린다(찌그러짐 방지).
// 이름·사진은 즉시 저장되지 않고 draft로 들고 있다가 '완료' 한 번으로 함께 반영된다.
// Firestore 단일 소스(Auth 미러링 없음). 사진은 Storage 에뮬레이터(users/{uid}/profile/avatar).

// 120x80 비정사각 PNG — 크롭 없이는 찌그러질 크기. Playwright setInputFiles로 첨부.
const PNG_120x80 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAHgAAABQCAIAAABd+SbeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAABHUlEQVR4nO3UwY1CARDDUOr2lV5/HTTAlc1o9aRUYDl+Pe/s+T2EF8rPn6gGdED3n97G6IBuriGjm4OTjm5OowO6uYaMbg5OOro5jQ7o5hoyujk46ejmNDqgm2vI6ObgpKOb0+iAbq4ho5uDk45uTqMDurmGjG4OTjq6OY0O6OYaMro5OOno5jQ6oJtryOjm4KSjm9PogG6uIaObg5OObk6jA7q5hoxuDk46ujmNDujmGjK6OTjp6OY0OqCba8jo5uCko5vT6IBuriGjm4OTjm5OowO6uYaMbg5OOro5jQ7o5hoyujk46ejmNDqgm2vI6ObgpKOb0+iAbq4ho5uDk45uTqMDurmGjG4OTjq6OY0O6OYaMro5OOlozvTrPlw8xJsfi5zEAAAAAElFTkSuQmCC',
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

  test('변경이 없으면 완료 버튼이 비활성화되어 있다', async ({ authedContext }) => {
    const { page } = authedContext;
    const profile = new ProfileEditPage(page);
    await profile.goto();

    await expect(profile.complete).toBeDisabled();
  });

  test('이름을 변경해 완료하면 설정 화면과 새로고침 후에도 유지된다', async ({ authedContext }) => {
    const { page } = authedContext;
    const profile = new ProfileEditPage(page);
    await profile.goto();

    await profile.setName('새로운이름');
    await expect(profile.complete).toBeEnabled();
    await profile.submit();

    const settings = new SettingsPage(page);
    await settings.goto();
    await expect(settings.profileName).toHaveText('새로운이름');

    await page.reload();
    await expect(settings.profileName).toHaveText('새로운이름');
  });

  test('사진을 크롭해 완료하면 표시되고 새로고침 후에도 유지된다', async ({ authedContext }) => {
    const { page } = authedContext;
    const profile = new ProfileEditPage(page);
    await profile.goto();

    // 초기엔 사진이 없어 삭제 버튼이 숨겨져 있다.
    await expect(profile.avatarRemove).toBeHidden();

    // 파일 선택 → 크롭 다이얼로그 → 적용
    await profile.avatarInput.setInputFiles({
      name: 'photo.png',
      mimeType: 'image/png',
      buffer: PNG_120x80,
    });
    await expect(profile.cropper).toBeVisible();
    await profile.cropApply.click();
    await expect(profile.cropper).toBeHidden();

    // 크롭 결과가 미리보기로 반영(삭제 버튼 노출) — 아직 저장 전
    await expect(profile.avatarRemove).toBeVisible();

    // 완료로 실제 업로드 + 저장 (submit이 저장 성공 토스트까지 대기)
    await profile.submit();
    await expect(profile.avatarRemove).toBeVisible();

    await page.reload();
    await expect(profile.avatarRemove).toBeVisible();
    await expect(profile.avatar.locator('img')).toHaveAttribute('src', /.+/);
  });

  test('크롭을 취소하면 사진이 반영되지 않는다', async ({ authedContext }) => {
    const { page } = authedContext;
    const profile = new ProfileEditPage(page);
    await profile.goto();

    await profile.avatarInput.setInputFiles({
      name: 'photo.png',
      mimeType: 'image/png',
      buffer: PNG_120x80,
    });
    await expect(profile.cropper).toBeVisible();
    await profile.cropCancel.click();
    await expect(profile.cropper).toBeHidden();

    // 사진 draft가 생기지 않아 삭제 버튼이 계속 숨겨져 있고 완료도 비활성
    await expect(profile.avatarRemove).toBeHidden();
    await expect(profile.complete).toBeDisabled();
  });

  test('사진을 삭제하고 완료하면 기본 아바타로 돌아간다', async ({ authedContext }) => {
    const { page } = authedContext;
    const profile = new ProfileEditPage(page);
    await profile.goto();

    // 먼저 사진을 하나 저장해 둔다
    await profile.pickAndCrop(PNG_120x80);
    await expect(profile.avatarRemove).toBeVisible();
    await profile.submit();
    await page.reload();
    await expect(profile.avatarRemove).toBeVisible();

    // 삭제 후 완료
    await profile.avatarRemove.click();
    await expect(profile.avatarRemove).toBeHidden();
    await profile.submit();

    await expect(profile.avatarRemove).toBeHidden();
    await page.reload();
    await expect(profile.avatarRemove).toBeHidden();
  });
});
