import { expect, type Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories } from '../helpers/emulator';

/**
 * 예산 위저드 — 첫 주 걷기(2026-11) 반영
 * - 빠른 모드(정기 수입·고정 지출·공통 변동 지출, 평균 1화면) / 전체 모드
 * - 평균 0원이면 그리드 생략, "이 항목은 건너뛰기"
 * - 수입 정기 항목 합산 안내
 * - 중간에 나가면 대시보드·경제 목표에 "이어서 하기"
 * - 헤더의 위치 선택 시트로 원하는 항목·검증·완료로 바로 이동
 *
 * E2E 기본 카테고리(seedDefaultCategories): 정기수입 2 · 비정기 2 · 고정 2 · 변동공통 2 · 변동각자 2
 *  → 빠른 모드 6단계, 전체 모드 14단계
 */

const WIZARD = '/inner/cashbook/plan/annual/wizard';

async function gotoIntro(page: Page) {
  await page.goto(`${WIZARD}?step=intro`);
  await expect(page.getByTestId('wizard-intro')).toBeVisible();
}

test.describe('예산 위저드', () => {
  test('빠른 모드가 기본이고, 정기 수입·고정 지출·공통 변동 지출만 평균 입력으로 돈다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await gotoIntro(page);

    await expect(page.getByTestId('wizard-mode-quick')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('wizard-intro-total')).toContainText('6개');

    await page.getByTestId('wizard-next').click();
    await page.waitForURL(/mode=quick/);
    await expect(page).toHaveURL(/step=income&catIdx=0&phase=avg/);
    await expect(page.getByTestId('regular-avg-input')).toBeVisible();

    await page.getByTestId('regular-avg-input-field').fill('3000000');
    await page.getByTestId('wizard-next').click();
    // 그리드 없이 바로 다음 항목(상여)의 평균 화면
    await expect(page).toHaveURL(/step=income&catIdx=1&phase=avg&mode=quick/);
    await expect(page.getByTestId('regular-avg-input')).toBeVisible();
  });

  test('전체 모드에서 평균 0원이면 그리드를 건너뛰고, 그리드 칸은 월 이름으로 읽힌다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await gotoIntro(page);

    await page.getByTestId('wizard-mode-full').click();
    await expect(page.getByTestId('wizard-intro-total')).toContainText('10개');
    await page.getByTestId('wizard-next').click();
    await expect(page).toHaveURL(/step=income&catIdx=0&phase=avg&mode=full/);

    // 0원인 채 다음 → 그리드 생략, 상여 평균으로
    await page.getByTestId('wizard-next').click();
    await expect(page).toHaveURL(/step=income&catIdx=1&phase=avg/);

    // 금액을 넣으면 그리드가 나오고, 12칸은 월 이름으로 접근 가능
    await page.getByTestId('regular-avg-input-field').fill('500000');
    await page.getByTestId('wizard-next').click();
    await expect(page).toHaveURL(/step=income&catIdx=1&phase=grid/);
    await expect(page.getByLabel('3월')).toBeVisible();
  });

  test('"이 항목은 건너뛰기"로 다음 항목으로 넘어간다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await gotoIntro(page);
    await page.getByTestId('wizard-next').click();
    await expect(page).toHaveURL(/catIdx=0&phase=avg/);

    await page.getByTestId('wizard-skip').click();
    await expect(page).toHaveURL(/step=income&catIdx=1&phase=avg/);
  });

  test('수입 정기 항목에는 두 사람 합산 안내가 보인다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await gotoIntro(page);
    await page.getByTestId('wizard-next').click();
    await expect(page.getByTestId('regular-avg-hint')).toContainText('두 사람');
  });

  test('중간에 나가면 경제 목표·대시보드에 이어서 하기가 보이고 같은 단계로 돌아온다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await gotoIntro(page);
    await page.getByTestId('wizard-next').click();
    await page.getByTestId('regular-avg-input-field').fill('3000000');
    await page.getByTestId('wizard-next').click();
    await expect(page).toHaveURL(/catIdx=1&phase=avg&mode=quick/);

    // X로 나가면 경제 목표 페이지 + 이어서 하기 카드
    await page.getByRole('button', { name: '위저드 종료' }).click();
    await page.waitForURL(/\/inner\/cashbook\/plan\/annual$/);
    const resume = page.getByTestId('annual-plan-resume');
    await expect(resume).toBeVisible();
    await expect(resume).toContainText('이어서');

    // 대시보드 카드도 "이어서 세우기"로 바뀐다
    await page.goto('/inner/cashbook');
    const card = page.getByTestId('annual-plan-prompt');
    await expect(card).toBeVisible();
    await expect(card).toContainText('예산 이어서 세우기');
    await expect(card).toContainText('1개 항목');
    await page.getByTestId('annual-plan-prompt-resume').click();
    await page.waitForURL(/\/plan\/annual\/wizard/);
    await expect(page).toHaveURL(/step=income&catIdx=1&phase=avg&mode=quick/);
  });

  test('대시보드 권유 카드로 연 위저드에서 나오면 경제 목표에 "홈으로" 버튼이 보이고 대시보드로 간다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/inner/cashbook');
    await page.getByTestId('annual-plan-prompt-start').click();
    await expect(page.getByTestId('wizard-intro')).toBeVisible();
    await expect(page).toHaveURL(/from=onboarding/);

    // 단계를 지나도 진입 표식이 따라다닌다
    await page.getByTestId('wizard-next').click();
    await page.getByTestId('regular-avg-input-field').fill('3000000');
    await page.getByTestId('wizard-next').click();
    await expect(page).toHaveURL(/catIdx=1&phase=avg&mode=quick.*from=onboarding/);
    await page.getByRole('button', { name: '위저드 종료' }).click();
    await page.waitForURL(/\/inner\/cashbook\/plan\/annual\?from=onboarding$/);

    // 걷기 재검증(2026-11-07): ←는 지나온 위저드 단계로 돌아가 대시보드에 닿을 길이 없었다
    const home = page.getByTestId('annual-plan-home');
    await expect(home).toBeVisible();
    await home.click();
    await page.waitForURL(/\/inner\/cashbook$/);
    await expect(page.getByTestId('dashboard-header')).toBeVisible();
  });

  test('이어서 하기 단계에는 진입 표식이 저장되지 않는다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/inner/cashbook');
    await page.getByTestId('annual-plan-prompt-start').click();
    await page.getByTestId('wizard-next').click();
    await page.getByTestId('regular-avg-input-field').fill('3000000');
    await page.getByTestId('wizard-next').click();
    await page.getByRole('button', { name: '위저드 종료' }).click();
    await page.waitForURL(/\/plan\/annual\?from=onboarding$/);

    // 경제 목표 페이지의 이어서 하기 링크에는 from이 붙지 않는다(설정 경로와 같은 저장값)
    const resumeLink = page.getByTestId('annual-plan-resume').getByRole('link');
    await expect(resumeLink).toHaveAttribute('href', /catIdx=1&phase=avg&mode=quick$/);
  });

  test('설정에서 들어온 경제 목표에는 "홈으로" 버튼이 없다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await gotoIntro(page);
    await page.getByTestId('wizard-next').click();
    await page.getByTestId('regular-avg-input-field').fill('3000000');
    await page.getByTestId('wizard-next').click();
    await page.getByRole('button', { name: '위저드 종료' }).click();
    await page.waitForURL(/\/inner\/cashbook\/plan\/annual$/);

    await expect(page.getByTestId('annual-plan-header')).toBeVisible();
    await expect(page.getByTestId('annual-plan-home')).toHaveCount(0);
  });
  test.describe('위치 선택', () => {
    async function openPicker(page: Page) {
      await page.getByTestId('wizard-step-picker').click();
      const sheet = page.getByTestId('wizard-step-sheet');
      await expect(sheet).toBeVisible();
      return sheet;
    }

    test('인트로에서는 위치 선택 버튼이 없다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      await gotoIntro(page);
      await expect(page.getByTestId('wizard-step-picker')).toHaveCount(0);
    });

    test('뒤쪽 항목으로 바로 건너뛰고, 앞 항목으로 돌아와도 입력값이 남아 있다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      await gotoIntro(page);
      await page.getByTestId('wizard-next').click();
      await expect(page).toHaveURL(/step=income&catIdx=0&phase=avg&mode=quick/);
      await page.getByTestId('regular-avg-input-field').fill('3000000');

      // 다음을 누르지 않고 바로 시트를 열어도 입력 중인 금액이 보인다
      let sheet = await openPicker(page);
      const salaryRow = sheet.getByTestId('wizard-step-row').filter({ hasText: '정기급여' });
      await expect(salaryRow).toHaveAttribute('aria-current', 'step');
      await expect(salaryRow).toContainText('월 300만원');
      await expect(sheet.getByTestId('wizard-step-row').filter({ hasText: '식비' })).toContainText(
        '—'
      );

      // 빠른 모드 지출: 월세(0) · 보험(1) · 식비(2) · 여행(3)
      await sheet.getByTestId('wizard-step-row').filter({ hasText: '식비' }).click();
      await expect(page).toHaveURL(/step=expense&catIdx=2&phase=avg&mode=quick/);
      await expect(page.getByTestId('wizard-step-sheet')).toHaveCount(0);
      await page.getByTestId('regular-avg-input-field').fill('500000');

      sheet = await openPicker(page);
      await expect(sheet.getByTestId('wizard-step-row').filter({ hasText: '식비' })).toContainText(
        '월 50만원'
      );
      await sheet.getByTestId('wizard-step-row').filter({ hasText: '정기급여' }).click();
      await expect(page).toHaveURL(/step=income&catIdx=0&phase=avg&mode=quick/);
      await expect(page.getByTestId('regular-avg-input-field')).toHaveValue('3,000,000');

      // 저장된 값이 새로고침 후에도 남아 있다
      await page.reload();
      sheet = await openPicker(page);
      await expect(sheet.getByTestId('wizard-step-row').filter({ hasText: '식비' })).toContainText(
        '월 50만원'
      );
    });

    test('검증을 통과하지 못했으면 "완료"를 눌러도 검증 단계로 간다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      await gotoIntro(page);
      await page.getByTestId('wizard-next').click();

      let sheet = await openPicker(page);
      await sheet.getByTestId('wizard-step-row').filter({ hasText: '월세' }).click();
      await expect(page).toHaveURL(/step=expense&catIdx=0&phase=avg/);
      await page.getByTestId('regular-avg-input-field').fill('1000000');

      sheet = await openPicker(page);
      await expect(sheet.getByTestId('wizard-step-summary')).toContainText('검증을 먼저');
      await sheet.getByTestId('wizard-step-summary').click();
      await expect(page).toHaveURL(/step=validate&mode=quick/);
    });

    test('검증을 통과했으면 "완료"로 바로 요약 단계에 간다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      await gotoIntro(page);
      await page.getByTestId('wizard-next').click();
      await page.getByTestId('regular-avg-input-field').fill('3000000');

      const sheet = await openPicker(page);
      await sheet.getByTestId('wizard-step-summary').click();
      await expect(page).toHaveURL(/step=summary&mode=quick/);
    });
  });
});
