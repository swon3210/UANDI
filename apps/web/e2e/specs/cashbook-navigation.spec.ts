import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedAnnualPlan } from '../helpers/emulator';

/**
 * 가계부 상단 분류 탭(대시보드/내역/현금흐름/목표) 제거 후의 진입 경로.
 * - 대시보드 헤더의 "내역" → 내역
 * - 내역의 "예상금액 조회하기" → 현금흐름
 * - 가계부 설정 → 경제 목표 → 목표
 */
test.describe('가계부 진입 경로 (상단 탭 없음)', () => {
  test('대시보드에 상단 분류 탭이 없다', async ({ authedPage }) => {
    await authedPage.goto('/inner/cashbook');
    await expect(authedPage.getByTestId('dashboard-header')).toBeVisible();
    await expect(authedPage.getByTestId('cashbook-tabs')).toHaveCount(0);
  });

  test('대시보드 헤더의 내역 버튼으로 내역에 진입한다', async ({ authedPage }) => {
    await authedPage.goto('/inner/cashbook');
    await authedPage.getByTestId('dashboard-history-link').click();
    await authedPage.waitForURL(/\/inner\/cashbook\/history$/, { timeout: 60000 });
    await expect(authedPage.getByTestId('cashbook-tabs')).toHaveCount(0);
  });

  test('내역의 예상금액 조회하기로 현금흐름에 진입한다', async ({ authedPage }) => {
    await authedPage.goto('/inner/cashbook/history');
    const link = authedPage.getByTestId('history-cashflow-link');
    await expect(link).toHaveText('예상금액 조회하기');
    await link.click();
    await authedPage.waitForURL(/\/inner\/cashbook\/cashflow$/, { timeout: 60000 });
    await expect(authedPage.getByTestId('cashflow-setup-button')).toBeVisible();
  });

  test('가계부 설정 → 경제 목표로 목표 화면에 진입한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedAnnualPlan(coupleId, new Date().getFullYear(), uid);

    await page.goto('/inner/cashbook/settings');
    await page.getByTestId('settings-link-annual-plan').click();
    await page.waitForURL(/\/inner\/cashbook\/plan\/annual/, { timeout: 60000 });
  });

  test('프로필 → 설정 → 가계부 설정에서 목표·카테고리·알림에 접근한다', async ({ authedPage }) => {
    await authedPage.goto('/inner/cashbook');
    await authedPage.getByTestId('profile-menu-trigger').click();
    await authedPage.getByTestId('menu-settings').click();
    await authedPage.waitForURL(/\/settings$/, { timeout: 60000 });
    await authedPage.getByTestId('settings-cashbook').click();
    await authedPage.waitForURL(/\/inner\/cashbook\/settings$/, { timeout: 60000 });
    await expect(authedPage.getByTestId('settings-link-annual-plan')).toBeVisible();
    await expect(authedPage.getByTestId('settings-link-categories')).toBeVisible();
    await expect(authedPage.getByTestId('settings-link-notifications')).toBeVisible();
  });
});

test.describe('올해 목표 자동 진입', () => {
  test.use({ seedAnnualPlanPrompted: false });

  test('올해 목표가 없으면 대시보드 진입 시 목표 설정 화면이 한 번 뜬다', async ({
    authedPage,
  }) => {
    // 로그인 직후(픽스처가 대시보드 진입까지 마침) 위저드로 이동한다
    await expect(authedPage).toHaveURL(/\/inner\/cashbook\/plan\/annual\/wizard/, {
      timeout: 20000,
    });

    // 두 번째 진입부터는 다시 뜨지 않는다 (설정에서 찾아 들어간다)
    await authedPage.goto('/inner/cashbook');
    await expect(authedPage.getByTestId('dashboard-header')).toBeVisible();
    await authedPage.waitForTimeout(2000);
    await expect(authedPage).toHaveURL(/\/inner\/cashbook$/);
  });

  test('올해 목표가 이미 있으면 자동으로 뜨지 않는다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedAnnualPlan(coupleId, new Date().getFullYear(), uid);
    // 로그인 직후 자동 진입으로 심긴 플래그를 지워, 목표 존재 여부만으로 판단하게 한다
    await page.evaluate(() =>
      window.localStorage.removeItem(`moa:annual-plan-prompt:${new Date().getFullYear()}`)
    );

    await page.goto('/inner/cashbook');
    await expect(page.getByTestId('dashboard-header')).toBeVisible();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/inner\/cashbook$/);
  });
});
