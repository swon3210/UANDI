import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  listAnnualPlans,
  seedAnnualPlan,
  seedAnnualPlanRevision,
  seedDefaultCategories,
} from '../helpers/emulator';

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

  test('좌우 버튼 폭이 달라도 대시보드 제목은 헤더 정중앙에 있다', async ({ authedPage }) => {
    await authedPage.goto('/inner/cashbook');
    const header = authedPage.getByTestId('dashboard-header');
    const title = header.getByText('대시보드', { exact: true });
    const headerBox = await header.boundingBox();
    const titleBox = await title.boundingBox();
    if (!headerBox || !titleBox) throw new Error('헤더/제목 위치를 읽지 못했다');
    const headerCenter = headerBox.x + headerBox.width / 2;
    const titleCenter = titleBox.x + titleBox.width / 2;
    expect(Math.abs(headerCenter - titleCenter)).toBeLessThan(2);
  });

  test('대시보드 헤더의 내역 버튼으로 내역에 진입한다', async ({ authedPage }) => {
    await authedPage.goto('/inner/cashbook');
    await authedPage.getByTestId('dashboard-history-link').click();
    await authedPage.waitForURL(/\/inner\/cashbook\/history$/, { timeout: 60000 });
    await expect(authedPage.getByTestId('cashbook-tabs')).toHaveCount(0);
  });

  test('내역 페이지는 제목이 내역이고 사이드바 토글 대신 뒤로가기로 대시보드에 돌아간다', async ({
    authedPage,
  }) => {
    await authedPage.goto('/inner/cashbook');
    await authedPage.getByTestId('dashboard-history-link').click();
    await authedPage.waitForURL(/\/inner\/cashbook\/history$/, { timeout: 60000 });

    const header = authedPage.getByTestId('cashbook-header');
    await expect(header).toContainText('내역');
    await expect(header).not.toContainText('가계부');
    await expect(authedPage.getByTestId('sidebar-trigger')).toHaveCount(0);

    await authedPage.getByTestId('header-back').click();
    await authedPage.waitForURL(/\/inner\/cashbook$/, { timeout: 60000 });
    await expect(authedPage.getByTestId('dashboard-header')).toBeVisible();
  });

  test('하위 페이지에 직접 진입해도 뒤로가기는 앱 안의 부모 페이지로 간다', async ({
    authedPage,
  }) => {
    // 딥링크처럼 현금흐름에 바로 진입(전체 로드) → 내역 → 대시보드로 거슬러 올라간다
    await authedPage.goto('/inner/cashbook/cashflow');
    await authedPage.getByTestId('header-back').click();
    await authedPage.waitForURL(/\/inner\/cashbook\/history$/, { timeout: 60000 });
    await authedPage.getByTestId('header-back').click();
    await authedPage.waitForURL(/\/inner\/cashbook$/, { timeout: 60000 });
    await expect(authedPage.getByTestId('dashboard-header')).toBeVisible();
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

test.describe('올해 예산 권유 카드', () => {
  test('올해 목표가 없으면 대시보드에 권유 카드가 보이고, 시작하기로 위저드에 간다', async ({
    authedPage,
  }) => {
    await expect(authedPage.getByTestId('dashboard-header')).toBeVisible();
    // 위저드로 자동 이동하지 않는다
    await authedPage.waitForTimeout(2000);
    await expect(authedPage).toHaveURL(/\/inner\/cashbook$/);

    const card = authedPage.getByTestId('annual-plan-prompt');
    await expect(card).toBeVisible();
    await expect(card).toContainText('올해 예산 세우기');
    await authedPage.getByTestId('annual-plan-prompt-start').click();
    await authedPage.waitForURL(/\/inner\/cashbook\/plan\/annual\/wizard/);
  });

  test('카드를 닫으면 숨고, 새로고침해도 다시 뜨지 않는다', async ({ authedPage }) => {
    const card = authedPage.getByTestId('annual-plan-prompt');
    await expect(card).toBeVisible();
    await authedPage.getByTestId('annual-plan-prompt-dismiss').click();
    await expect(card).toBeHidden();

    await authedPage.goto('/inner/cashbook');
    await expect(authedPage.getByTestId('dashboard-header')).toBeVisible();
    await expect(card).toHaveCount(0);
  });

  test('플랜은 있는데 위저드를 끝내지 않았으면 이어서 세우기 카드가 보인다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedAnnualPlan(coupleId, new Date().getFullYear(), uid);
    await page.goto('/inner/cashbook');
    await expect(page.getByTestId('dashboard-header')).toBeVisible();
    const card = page.getByTestId('annual-plan-prompt');
    await expect(card).toBeVisible();
    await expect(card).toContainText('예산 이어서 세우기');
    await expect(page.getByTestId('annual-plan-prompt-resume')).toBeVisible();
  });

  test('올해 목표를 완성했으면(리비전 있음) 카드가 없다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    const planId = await seedAnnualPlan(coupleId, new Date().getFullYear(), uid);
    await seedAnnualPlanRevision(coupleId, planId, uid);
    await page.goto('/inner/cashbook');
    await expect(page.getByTestId('dashboard-header')).toBeVisible();
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('annual-plan-prompt')).toHaveCount(0);
  });

  test('위저드 인트로에서 X로 나가면 빈 플랜이 지워지고 대시보드로 돌아온다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/inner/cashbook/plan/annual/wizard?step=intro');
    await expect(page.getByRole('button', { name: '위저드 종료' })).toBeVisible();
    // 진입 즉시 플랜이 만들어진다
    await expect
      .poll(async () => (await listAnnualPlans(coupleId)).length, { timeout: 10000 })
      .toBe(1);

    await page.getByRole('button', { name: '위저드 종료' }).click();
    await page.waitForURL(/\/inner\/cashbook$/);
    await expect
      .poll(async () => (await listAnnualPlans(coupleId)).length, { timeout: 10000 })
      .toBe(0);
    // 플랜이 없으니 권유 카드가 다시 보인다
    await expect(page.getByTestId('annual-plan-prompt')).toBeVisible();
  });
});
