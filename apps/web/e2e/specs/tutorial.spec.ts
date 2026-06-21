import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

/**
 * MOA 온보딩 투어.
 * - 로그인 후 대시보드(/inner/cashbook) 첫 진입 시 1회 자동 노출
 * - 환영(마스코트) + 가계부(내역·예산·현금흐름·결산) + 그 외 기능 + 마무리(마스코트)를 7장으로 안내, "시작하기"로 종료
 * - 종료 후에는 재방문해도 자동 노출되지 않음(localStorage seen 플래그)
 * - 프로필 메뉴 "튜토리얼 다시 보기"로 언제든 재생
 */
const OVERLAY = 'service-tour-overlay';
const TOTAL = 7;

test.describe('MOA 온보딩 투어', () => {
  test.describe('첫 진입 자동 노출', () => {
    // 자동 노출을 검증하기 위해 seen 플래그를 심지 않는다.
    test.use({ seedTourSeen: false });

    test('대시보드 첫 진입 시 자동으로 열리고, 끝까지 넘겨 시작하면 닫히며 다시 열리지 않는다', async ({
      authedPage,
    }) => {
      const overlay = authedPage.getByTestId(OVERLAY);

      // 자동 노출 + 첫 슬라이드
      await expect(overlay).toBeVisible({ timeout: 15000 });
      await expect(authedPage.getByTestId('tour-step-indicator')).toHaveText(`1 / ${TOTAL}`);
      await expect(authedPage.getByTestId('tour-prev')).toBeDisabled();

      // 마지막 슬라이드까지 이동
      for (let i = 2; i <= TOTAL; i++) {
        await authedPage.getByTestId('tour-next').click();
        await expect(authedPage.getByTestId('tour-step-indicator')).toHaveText(`${i} / ${TOTAL}`);
      }

      // 마지막 슬라이드: 시작하기 노출 / 건너뛰기 숨김
      await expect(authedPage.getByTestId('tour-start')).toBeVisible();
      await expect(authedPage.getByTestId('tour-skip')).toHaveCount(0);

      // 종료
      await authedPage.getByTestId('tour-start').click();
      await expect(overlay).toBeHidden();

      // 재방문 시 자동 노출되지 않음 (앱이 seen 플래그를 저장)
      await authedPage.goto('/inner/cashbook');
      await expect(authedPage.getByTestId('dashboard-header')).toBeVisible();
      await expect(overlay).toHaveCount(0);
    });

    test('건너뛰기로 즉시 닫을 수 있다', async ({ authedPage }) => {
      const overlay = authedPage.getByTestId(OVERLAY);
      await expect(overlay).toBeVisible({ timeout: 15000 });
      await authedPage.getByTestId('tour-skip').click();
      await expect(overlay).toBeHidden();
    });
  });

  test.describe('수동 재생', () => {
    // 기본값(seedTourSeen: true) → 자동 노출되지 않는다.
    test('자동 노출되지 않으며 프로필 메뉴 "튜토리얼 다시 보기"로 다시 열 수 있다', async ({
      authedPage,
    }) => {
      await authedPage.goto('/inner/cashbook');
      await expect(authedPage.getByTestId('dashboard-header')).toBeVisible();
      await expect(authedPage.getByTestId(OVERLAY)).toHaveCount(0);

      await authedPage.getByTestId('profile-menu-trigger').click();
      await authedPage.getByTestId('menu-tour').click();

      await expect(authedPage.getByTestId(OVERLAY)).toBeVisible();
      await expect(authedPage.getByTestId('tour-step-indicator')).toHaveText(`1 / ${TOTAL}`);
    });
  });
});
