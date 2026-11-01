import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

/**
 * 말랑 가계부 온보딩 투어 — "첫 행동 안내" 3장.
 * - 커플 연결 후 대시보드 첫 진입: 화면이 먼저 그려지고 잠시 뒤 1회 자동 노출
 * - 1) 둘이 함께 쓰는 가계부 2) 첫 내역 적기(+ 버튼) 3) 예산·예측은 차차
 * - 마지막 장 "첫 내역 적기" → 빠른 추가 시트 / "둘러볼게요" → 닫기
 * - 종료 후에는 재방문해도 자동 노출되지 않음(localStorage seen 플래그)
 * - 프로필 메뉴 "튜토리얼 다시 보기"로 언제든 재생
 */
const OVERLAY = 'service-tour-overlay';
const TOTAL = 3;

test.describe('말랑 가계부 온보딩 투어', () => {
  test.describe('첫 진입 자동 노출', () => {
    // 자동 노출을 검증하기 위해 seen 플래그를 심지 않는다.
    test.use({ seedTourSeen: false });

    test('대시보드가 먼저 보이고 잠시 뒤 열리며, 끝까지 넘기면 첫 내역 적기로 빠른 추가 시트가 열린다', async ({
      authedPage,
    }) => {
      const overlay = authedPage.getByTestId(OVERLAY);

      // 화면이 먼저: 헤더는 보이는데 투어는 아직 없다
      await expect(authedPage.getByTestId('dashboard-header')).toBeVisible();
      await expect(overlay).toHaveCount(0);

      // 잠시 뒤 자동 노출 + 첫 슬라이드
      await expect(overlay).toBeVisible({ timeout: 15000 });
      await expect(authedPage.getByTestId('tour-step-indicator')).toHaveText(`1 / ${TOTAL}`);
      await expect(authedPage.getByTestId('tour-prev')).toBeDisabled();
      await expect(overlay).toContainText('둘이 함께 쓰는 가계부예요');
      await expect(overlay).not.toContainText('결산');

      // 마지막 슬라이드까지 이동
      for (let i = 2; i <= TOTAL; i++) {
        await authedPage.getByTestId('tour-next').click();
        await expect(authedPage.getByTestId('tour-step-indicator')).toHaveText(`${i} / ${TOTAL}`);
      }

      // 마지막 슬라이드: 첫 내역 적기 + 둘러볼게요 노출 / 건너뛰기 숨김
      await expect(authedPage.getByTestId('tour-first-entry')).toBeVisible();
      await expect(authedPage.getByTestId('tour-start')).toBeVisible();
      await expect(authedPage.getByTestId('tour-skip')).toHaveCount(0);

      // 첫 내역 적기 → 투어 닫힘 + 빠른 추가 시트
      await authedPage.getByTestId('tour-first-entry').click();
      await expect(overlay).toBeHidden();
      await expect(authedPage.getByTestId('quick-add-sheet')).toBeVisible();
    });

    test('둘러볼게요로 닫으면 재방문 시 자동 노출되지 않는다', async ({ authedPage }) => {
      const overlay = authedPage.getByTestId(OVERLAY);
      await expect(overlay).toBeVisible({ timeout: 15000 });
      await authedPage.getByTestId('tour-next').click();
      await authedPage.getByTestId('tour-next').click();
      await authedPage.getByTestId('tour-start').click();
      await expect(overlay).toBeHidden();

      await authedPage.goto('/inner/cashbook');
      await expect(authedPage.getByTestId('dashboard-header')).toBeVisible();
      // 자동 노출 지연(1.5초)보다 길게 기다려도 다시 뜨지 않는다
      await authedPage.waitForTimeout(2500);
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
