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
