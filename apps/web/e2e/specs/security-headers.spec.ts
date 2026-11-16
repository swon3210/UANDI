import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

/**
 * 보안 헤더(CSP 등) — next.config.ts headers(). (docs/01-tech-stack.md 「보안 헤더」)
 * 헤더가 붙는지와, CSP 가 앱 자신의 동작을 막지 않는지(위반 0건)를 본다.
 */
function collectCspViolations(page: Page): string[] {
  const violations: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' && text.includes('Content Security Policy')) violations.push(text);
  });
  return violations;
}

test.describe('보안 헤더', () => {
  test('페이지 응답에 CSP와 기본 보안 헤더가 붙는다', async ({ request }) => {
    const res = await request.get('/privacy');
    const headers = res.headers();
    const csp = headers['content-security-policy'] ?? '';

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['permissions-policy']).toContain('geolocation=()');
  });

  test('Firebase Auth 핸들러 프록시(/__/*)에는 CSP를 씌우지 않는다', async ({ request }) => {
    // 프록시 대상 응답 여부와 무관하게, 우리 CSP 가 붙지 않았는지만 본다
    const res = await request.get('/__/auth/handler', { maxRedirects: 0 }).catch(() => null);
    test.skip(res === null, '프록시 대상에 연결할 수 없는 환경');
    expect(res!.headers()['content-security-policy'] ?? '').not.toContain("frame-ancestors 'self'");
  });

  test('랜딩에서 CSP 위반이 없다', async ({ page }) => {
    const violations = collectCspViolations(page);
    await page.goto('/');
    await expect(page.getByTestId('google-login-btn')).toBeVisible();
    expect(violations).toEqual([]);
  });

  test('로그인 후 대시보드·내역·갤러리·설정에서 CSP 위반이 없다', async ({ authedPage }) => {
    test.setTimeout(90000); // dev 서버가 네 화면을 처음 컴파일하는 시간 포함
    const violations = collectCspViolations(authedPage);
    for (const path of [
      '/inner/cashbook',
      '/inner/cashbook/history',
      '/inner/photos',
      '/settings',
    ]) {
      await authedPage.goto(path);
      // Firestore 실시간 연결 때문에 networkidle 은 오지 않는다. 화면이 데이터를 받아 그릴 시간만 준다.
      await authedPage.waitForLoadState('load');
      await authedPage.waitForTimeout(2000);
    }
    expect(violations).toEqual([]);
  });
});
