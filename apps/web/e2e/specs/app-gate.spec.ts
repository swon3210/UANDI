import { expect, test } from '@playwright/test';
import { clearEmulatorData, createTestUser } from '../helpers/emulator';

/**
 * 앱 전용 게이트 — 일반 브라우저는 앱 설치 안내(/get-app)로 보낸다. (docs/pages/08-get-app.md)
 * 다른 spec 은 playwright.config.ts 가 붙이는 앱 표식 UA 로 돌고, 여기서만 일반 브라우저 UA 를 쓴다.
 */
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const IOS_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

test.describe('앱 전용 게이트 — 일반 브라우저', () => {
  test.use({ userAgent: BROWSER_UA });

  test('/ 로 들어오면 앱 설치 안내로 이동하고 스토어 링크가 보인다', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/get-app$/);
    await expect(page.getByTestId('app-install-landing')).toBeVisible();
    await expect(page.getByTestId('play-store-link')).toHaveAttribute(
      'href',
      /play\.google\.com\/store\/apps\/details\?id=com\.swon3210\.uandi/
    );
    await expect(page.getByTestId('app-store-link')).toHaveAttribute('href', /apps\.apple\.com/);
    await expect(page.getByTestId('google-login-btn')).toHaveCount(0);
  });

  test('앱 화면 경로로 직접 들어와도 안내로 이동한다', async ({ page }) => {
    for (const path of ['/inner/cashbook', '/onboarding', '/settings']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/get-app\?next=/);
      await expect(page.getByTestId('app-install-landing')).toBeVisible();
    }
  });

  test('초대 링크로 들어오면 설치 후 다시 누르라는 안내가 보인다', async ({ page }) => {
    await page.goto('/invite/AB12CD');
    await expect(page).toHaveURL(/\/get-app\?next=%2Finvite%2FAB12CD$/);
    await expect(page.getByTestId('app-install-invite-hint')).toBeVisible();
  });

  test('공개 페이지(개인정보처리방침·고객 지원·계정 삭제)는 그대로 열린다', async ({ page }) => {
    for (const path of ['/privacy', '/support', '/account-deletion']) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
  });

  test('정적 파일은 막지 않는다', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });

  test('브라우저에 남아 있던 로그인 세션은 안내 페이지에서 지워진다', async ({ page }) => {
    await clearEmulatorData();
    await createTestUser('gate-user@test.com', 'testpassword123');

    await page.goto('/get-app');
    await page.waitForFunction(
      () => typeof (window as any).__signInWithEmailAndPassword === 'function'
    );
    await page.evaluate(async () => {
      const w = window as any;
      await w.__signInWithEmailAndPassword(w.__auth, 'gate-user@test.com', 'testpassword123');
    });

    await expect
      .poll(() => page.evaluate(() => (window as any).__auth.currentUser === null))
      .toBe(true);
    // 로드 도중 로그아웃돼도 "계정 정보를 불러오지 못했어요" 오버레이가 남지 않는다.
    // (사용자 문서 읽기 재시도가 끝나는 시간 ≈ 3초를 넘겨서 확인)
    await page.waitForTimeout(5000);
    await expect(page.getByTestId('auth-load-error')).toHaveCount(0);
    await expect(page.getByTestId('app-install-landing')).toBeVisible();

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'uandi-auth')).toBeUndefined();
  });
});

test.describe('앱 전용 게이트 — 앱(WebView)', () => {
  test('앱 표식 UA 는 게이트를 통과해 랜딩(로그인)이 보인다', async ({ page }) => {
    // 기본 UA = playwright.config.ts 의 앱 표식 UA
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('google-login-btn')).toBeVisible();
  });

  test.describe('표식 UA 가 없는 앱(iOS·구버전)', () => {
    test.use({ userAgent: IOS_SAFARI_UA });

    test('네이티브 브리지가 있으면 쿠키를 심고 원래 경로로 돌아간다', async ({ page }) => {
      await page.addInitScript(() => {
        (window as any).ReactNativeWebView = { postMessage() {} };
      });
      await page.goto('/privacy');
      await page.goto('/');
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByTestId('google-login-btn')).toBeVisible();

      const cookies = await page.context().cookies();
      expect(cookies.find((c) => c.name === 'uandi-app')?.value).toBe('1');

      // 쿠키가 생긴 뒤로는 안내 페이지를 거치지 않는다
      const res = await page.request.get('/onboarding', { maxRedirects: 0 });
      expect(res.headers().location ?? '').not.toContain('/get-app');
    });
  });

  test.describe('플로팅 버블(브리지 없는 Android WebView)', () => {
    test.use({
      userAgent:
        'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36',
    });

    test('/overlay 는 wv UA 만으로 통과하지만 다른 경로는 안내로 간다', async ({ request }) => {
      const overlay = await request.get('/overlay/quick-add', { maxRedirects: 0 });
      expect(overlay.headers().location ?? '').not.toContain('/get-app');

      const home = await request.get('/', { maxRedirects: 0 });
      expect(home.status()).toBe(307);
      expect(home.headers().location).toContain('/get-app');
    });
  });
});
