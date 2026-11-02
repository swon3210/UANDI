import { expect, type Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedCashbookCategory, seedDefaultCategories } from '../helpers/emulator';

/**
 * 빠른 추가 시트 — 첫 주 걷기(2026-11) 반영
 * - 화살표 아이콘만으로는 수동 폼 경로를 못 찾는다 → "직접 입력" 텍스트 버튼
 * - 추가 토스트에 "내역 보기" 액션
 * - 동명 카테고리(공통 식비 / 각자 식비)는 칩에 구분 라벨
 */

async function openQuickAddOnDashboard(page: Page) {
  await page.goto('/inner/cashbook');
  await expect(page.getByTestId('dashboard-header')).toBeVisible();
  await page.getByTestId('cashbook-fab').click();
  await expect(page.getByTestId('quick-add-sheet')).toBeVisible();
}

test.describe('빠른 추가 시트', () => {
  test('직접 입력 버튼으로 수동 입력 폼이 열린다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await openQuickAddOnDashboard(page);

    const manual = page.getByTestId('quick-add-manual');
    await expect(manual).toBeVisible();
    await expect(manual).toContainText('직접 입력');
    await manual.click();
    await expect(page.getByTestId('entry-form-sheet')).toBeVisible();
  });

  test('직접 입력 폼에서 저장하면 폼과 빠른 추가 시트가 함께 닫힌다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await openQuickAddOnDashboard(page);
    await page.getByTestId('quick-add-manual').click();

    const form = page.getByTestId('entry-form-sheet');
    await expect(form).toBeVisible();
    await form.getByLabel('금액').fill('9000');
    await form.getByTestId('category-chip-식비').click();
    await form.getByRole('button', { name: '저장' }).click();

    await expect(page.getByText('내역을 추가했어요')).toBeVisible();
    await expect(form).toHaveCount(0);
    // 6구간 걷기: 저장 뒤 빠른 추가 시트가 남아 한 번 더 닫아야 했다
    await expect(page.getByTestId('quick-add-sheet')).toHaveCount(0);
  });

  test('AI 파싱 결과를 추가하면 토스트의 "내역 보기"로 내역 화면에 간다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await openQuickAddOnDashboard(page);

    await page.getByTestId('ai-parse-input').fill('점심 김치찌개 9000원');
    await page.getByTestId('ai-parse-submit').click();
    // 개발 서버의 API 라우트 첫 컴파일까지 감안(가져오기 스펙과 동일)
    await expect(page.getByTestId('ai-bulk-preview-sheet')).toBeVisible({ timeout: 20000 });
    await page.getByTestId('ai-bulk-confirm').click();

    const viewAction = page.getByRole('button', { name: '내역 보기' });
    await expect(viewAction).toBeVisible();
    await viewAction.click();
    await page.waitForURL(/\/inner\/cashbook\/history/);
    await expect(page.getByText('김치찌개')).toBeVisible();
  });

  test('직접 입력 폼에서 이름이 같은 카테고리는 공통/각자 라벨로 구분된다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId); // 변동 지출(공통) 식비 포함
    await seedCashbookCategory(coupleId, {
      group: 'expense',
      subGroup: 'variable_personal',
      name: '식비',
      icon: 'fork_knife',
      sortOrder: 9,
    });
    await openQuickAddOnDashboard(page);
    await page.getByTestId('quick-add-manual').click();
    const form = page.getByTestId('entry-form-sheet');
    await expect(form).toBeVisible();

    await expect(form.getByRole('button', { name: '식비 (공통)' })).toBeVisible();
    await expect(form.getByRole('button', { name: '식비 (각자)' })).toBeVisible();
    // 이름이 겹치지 않는 카테고리는 그대로
    await expect(form.getByRole('button', { name: '여행', exact: true })).toBeVisible();
  });
});
