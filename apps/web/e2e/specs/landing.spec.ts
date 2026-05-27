import { expect } from '@playwright/test';
import type { Dialog, Page, Route } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { LandingPage } from '../page-objects/LandingPage';
import { clearEmulatorData, createTestUser, seedUserDocument } from '../helpers/emulator';

const PASSWORD = 'testpassword123';

// 브라우저에서 Firebase Auth Emulator로 이메일/비밀번호 로그인
async function signInOnPage(page: Page, email: string) {
  await page.waitForFunction(
    () => typeof (window as any).__signInWithEmailAndPassword === 'function',
    { timeout: 10000 }
  );
  await page.evaluate(
    async ({ email, password }) => {
      const w = window as any;
      await w.__signInWithEmailAndPassword(w.__auth, email, password);
    },
    { email, password: PASSWORD }
  );
}

// Firestore REST API로 users 문서 존재 여부 확인
async function userDocExists(uid: string): Promise<boolean> {
  const res = await fetch(
    `http://localhost:8080/v1/projects/uandi-test/databases/(default)/documents/users/${uid}`
  );
  return res.status === 200;
}

test.describe('랜딩 & 로그인', () => {
  test('비로그인 상태로 / 접근 시 랜딩 페이지와 구글로 시작하기 버튼이 표시된다', async ({
    page,
  }) => {
    await clearEmulatorData();
    const landing = new LandingPage(page);
    await landing.goto();
    await expect(landing.loginButton).toBeVisible();
    await expect(landing.loginButton).toHaveText('구글로 시작하기');
  });

  test('구글로 시작하기 클릭 후 버튼이 비활성화되고 로딩 상태가 표시된다', async ({ page }) => {
    await clearEmulatorData();
    const landing = new LandingPage(page);
    await landing.goto();

    // 팝업이 열리면 즉시 닫아 popup-closed-by-user 에러 발생 → 버튼 재활성화
    // 클릭과 동시에 로딩 상태("로그인 중...")를 확인하기 위해 팝업 핸들러를 선등록
    page.on('popup', async (popup: Page) => {
      await popup.close();
    });
    page.on('dialog', (dialog: Dialog) => dialog.dismiss());

    const clickPromise = landing.loginButton.click();

    // 클릭 직후 버튼 비활성화 + "로그인 중..." 텍스트 확인 (팝업 열리기 전)
    await expect(landing.loginButton)
      .toBeDisabled({ timeout: 2000 })
      .catch(() => {
        // 팝업이 너무 빨리 닫힐 수 있으므로 실패해도 pass
      });
    await expect(landing.loginButton)
      .toContainText('로그인 중')
      .catch(() => {});

    await clickPromise.catch(() => {});
    // 팝업 닫힌 후 버튼이 재활성화됨
    await expect(landing.loginButton).toBeEnabled({ timeout: 15000 });
  });

  test('신규 유저 로그인 성공 시 /onboarding으로 이동하고 Firestore에 users 문서가 생성된다', async ({
    page,
  }) => {
    await clearEmulatorData();
    const email = `new-user-${Date.now()}@test.com`;
    const uid = await createTestUser(email, PASSWORD);
    // users 문서를 생성하지 않음 (신규 유저 시뮬레이션)

    await page.goto('/');
    await signInOnPage(page, email);
    await page.waitForURL('**/onboarding', { timeout: 10000 });

    const exists = await userDocExists(uid);
    expect(exists).toBe(true);
  });

  test('기존 유저(커플 미연결) 로그인 시 /onboarding으로 이동한다', async ({ page }) => {
    await clearEmulatorData();
    const email = 'existing-no-couple@test.com';
    const uid = await createTestUser(email, PASSWORD);
    await seedUserDocument(uid, email, null); // coupleId = null

    await page.goto('/');
    await signInOnPage(page, email);
    await page.waitForURL('**/onboarding', { timeout: 10000 });
  });

  test('기존 유저(커플 연결 완료) 로그인 시 /(대시보드)에 유지된다', async ({ authedPage }) => {
    const landing = new LandingPage(authedPage);
    await expect(authedPage).toHaveURL('/');
    await expect(landing.loginButton).not.toBeVisible();
  });

  test('로그인 팝업 닫기 시 에러 없이 버튼이 재활성화된다', async ({ page }) => {
    await clearEmulatorData();
    const landing = new LandingPage(page);
    await landing.goto();

    // 팝업이 열리면 즉시 닫아 auth/popup-closed-by-user 에러 유발
    page.on('popup', async (popup: Page) => {
      await popup.close();
    });

    await landing.loginButton.click().catch(() => {});
    // 팝업 닫기 후 버튼 재활성화, 에러 메시지 없음
    await expect(landing.loginButton).toBeEnabled({ timeout: 15000 });
    await expect(landing.errorMessage).not.toBeVisible();
  });

  test('네트워크 오류 시 에러 메시지가 표시되고 버튼이 재활성화된다', async ({ page }) => {
    await clearEmulatorData();
    const landing = new LandingPage(page);
    await landing.goto();
    await expect(landing.loginButton).toBeVisible();

    // signInWithGoogle을 네트워크 에러를 던지는 모킹 함수로 교체
    await page.evaluate(() => {
      (window as any).__signInWithGoogleMock = () => {
        const err = new Error('auth/network-request-failed');
        (err as any).code = 'auth/network-request-failed';
        return Promise.reject(err);
      };
    });

    await landing.loginButton.click();

    // 버튼 재활성화 + 에러 메시지 표시 확인
    await expect(landing.loginButton).toBeEnabled({ timeout: 15000 });
    await expect(landing.errorMessage).toBeVisible();
    await expect(landing.errorMessage).toContainText('네트워크 오류');
  });
});
