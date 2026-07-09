import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedFcmToken, listFcmTokens } from '../helpers/emulator';

test.describe('로그아웃 시 FCM 토큰 정리', () => {
  test('로그아웃하면 현재 기기의 네이티브 FCM 토큰이 제거된다', async ({ authedContext }) => {
    const { page, uid } = authedContext;
    const NATIVE_TOKEN = 'native-token-logout-test-abc123';

    // 네이티브(모바일 WebView)가 등록한 것처럼 토큰 문서를 심는다
    await seedFcmToken(uid, NATIVE_TOKEN, {
      platform: 'android',
      userAgent: 'UANDI-Mobile/Android',
    });
    // 브리지가 주입한 것처럼 현재 창에 토큰을 노출
    await page.evaluate((t) => {
      (window as unknown as { __UANDI_NATIVE__?: { fcmToken: string } }).__UANDI_NATIVE__ = {
        fcmToken: t,
      };
    }, NATIVE_TOKEN);

    // 사전 확인: 토큰이 등록돼 있다
    expect(await listFcmTokens(uid)).toContain(NATIVE_TOKEN);

    // 프로필 메뉴 → 로그아웃
    await page.getByTestId('profile-menu-trigger').click();
    await page.getByTestId('menu-logout').click();

    // 로그아웃 처리 중 현재 기기 토큰이 제거된다
    await expect
      .poll(async () => await listFcmTokens(uid), { timeout: 10000 })
      .not.toContain(NATIVE_TOKEN);
  });
});
