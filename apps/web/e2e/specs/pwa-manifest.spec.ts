import { test, expect, request } from '@playwright/test';

const ICON_PATHS = [
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
];

test.describe('PWA manifest', () => {
  test('manifest.webmanifest 응답이 200이고 필수 필드를 포함한다', async ({ baseURL }) => {
    const ctx = await request.newContext({ baseURL });
    const res = await ctx.get('/manifest.webmanifest');
    expect(res.status()).toBe(200);

    const json = await res.json();
    expect(json.name).toBe('UANDI 가계부');
    expect(json.short_name).toBe('UANDI');
    expect(json.start_url).toBe('/');
    expect(json.scope).toBe('/');
    expect(json.display).toBe('standalone');
    expect(json.theme_color).toBe('#E8837A');
    expect(json.background_color).toBe('#FAFAF8');

    expect(Array.isArray(json.icons)).toBe(true);
    const purposes = json.icons.map((i: { purpose?: string }) => i.purpose);
    expect(purposes).toContain('any');
    expect(purposes).toContain('maskable');

    const sizes = json.icons.map((i: { sizes?: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');

    await ctx.dispose();
  });

  test('manifest 아이콘 파일이 모두 200으로 응답한다', async ({ baseURL }) => {
    const ctx = await request.newContext({ baseURL });
    for (const path of ICON_PATHS) {
      const res = await ctx.get(path);
      expect.soft(res.status(), `${path} 응답 코드`).toBe(200);
      const contentType = res.headers()['content-type'] ?? '';
      if (path.endsWith('.png')) {
        expect.soft(contentType, `${path} 콘텐츠 타입`).toContain('image/png');
      }
      if (path.endsWith('.svg')) {
        expect.soft(contentType, `${path} 콘텐츠 타입`).toContain('image/svg');
      }
    }
    await ctx.dispose();
  });

  test('HTML head에 manifest link와 theme-color, apple-touch 메타가 포함된다', async ({ page }) => {
    await page.goto('/');
    const manifestHref = await page.locator('link[rel="manifest"]').first().getAttribute('href');
    expect(manifestHref).toBeTruthy();
    expect(manifestHref).toMatch(/manifest\.webmanifest/);

    const themeColor = await page
      .locator('meta[name="theme-color"]')
      .first()
      .getAttribute('content');
    expect(themeColor?.toUpperCase()).toBe('#E8837A');

    // Next.js 15 metadata API는 표준 이름인 mobile-web-app-capable로 출력한다
    // (iOS Safari는 두 이름 모두 인식. apple-* 형태는 deprecated)
    const capable = await page
      .locator('meta[name="mobile-web-app-capable"]')
      .first()
      .getAttribute('content');
    expect(capable).toBe('yes');

    const appleTitle = await page
      .locator('meta[name="apple-mobile-web-app-title"]')
      .first()
      .getAttribute('content');
    expect(appleTitle).toBe('UANDI 가계부');
  });
});
