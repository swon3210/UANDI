import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories } from '../helpers/emulator';

test.describe('푸시 딥링크 빠른 입력 (quickAdd)', () => {
  test('quickAdd 딥링크로 진입하면 prefill된 내역 추가 시트가 열린다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto(
      `/inner/cashbook/history?quickAdd=1&qaType=expense&qaCategory=${encodeURIComponent(
        '월세'
      )}&qaAmount=800000`
    );

    // 추가 시트가 자동으로 열림
    await expect(page.getByTestId('entry-form-sheet')).toBeVisible();

    // 금액이 prefill됨
    await expect(page.getByLabel('금액')).toHaveValue('800000');

    // 카테고리(월세)가 선택됨 → 선택 시 breadcrumb 노출
    await expect(page.getByTestId('category-breadcrumb')).toContainText('월세');
  });

  test('고정 수입(정기급여) 딥링크도 수입 타입으로 prefill되어 열린다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto(
      `/inner/cashbook/history?quickAdd=1&qaType=income&qaCategory=${encodeURIComponent(
        '정기급여'
      )}&qaAmount=3000000`
    );

    await expect(page.getByTestId('entry-form-sheet')).toBeVisible();
    await expect(page.getByLabel('금액')).toHaveValue('3000000');
    await expect(page.getByTestId('category-breadcrumb')).toContainText('정기급여');
  });

  test('quickAdd 처리 후 URL이 정리되어 새로고침 시 시트가 다시 열리지 않는다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto(
      `/inner/cashbook/history?quickAdd=1&qaType=expense&qaCategory=${encodeURIComponent(
        '월세'
      )}&qaAmount=800000`
    );
    await expect(page.getByTestId('entry-form-sheet')).toBeVisible();

    // URL에서 quickAdd 쿼리가 제거됨
    await expect(page).toHaveURL(/\/inner\/cashbook\/history$/);

    // 새로고침하면 시트가 다시 열리지 않음
    await page.reload();
    await expect(page.getByTestId('entry-form-sheet')).not.toBeVisible();
  });
});

test.describe('가계부 전역 FAB', () => {
  test('내역 페이지에서 FAB를 누르면 빠른 추가 시트가 열린다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    const fab = page.getByTestId('cashbook-fab');
    await expect(fab).toBeVisible();
    await fab.click();

    await expect(page.getByTestId('quick-add-sheet')).toBeVisible();
  });

  test('대시보드 등 다른 가계부 화면에서도 FAB가 보인다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto('/inner/cashbook');
    await expect(page.getByTestId('cashbook-fab')).toBeVisible();
  });

  test('풀스크린(chromeless) 설정 화면에서는 FAB가 숨겨진다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto('/inner/cashbook/settings');
    await expect(page.getByTestId('cashbook-fab')).toHaveCount(0);
  });

  test('네이티브 앱(웹뷰 포그라운드)에서도 웹 FAB가 보인다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    // 네이티브 플로팅 버블은 앱이 백그라운드일 때만 뜨므로, 포그라운드 웹뷰에서는
    // 웹 FAB가 추가 진입점이 되어야 한다.
    await page.addInitScript(() => {
      (window as unknown as { __UANDI_NATIVE__: unknown }).__UANDI_NATIVE__ = {
        platform: 'android',
      };
    });

    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');
    await expect(page.getByTestId('cashbook-fab')).toBeVisible();
  });
});
