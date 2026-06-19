import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedCashbookCategory,
  seedCashbookEntry,
  seedAnnualPlan,
  seedAnnualPlanItem,
} from '../helpers/emulator';

/**
 * 월 점검 페이지: 예산 vs 실적 차트 + AI 보고서 + 다운로드.
 * 차트가 그려지려면 연간 계획(예산) + 카테고리 + 내역이 모두 필요하므로 함께 시드한다.
 */
async function seedSettlementData(coupleId: string, uid: string) {
  const year = new Date().getFullYear();

  // 지출 카테고리(식비) + 연간 계획 예산 30만/월
  const foodCatId = await seedCashbookCategory(coupleId, {
    group: 'expense',
    subGroup: 'variable_common',
    name: '식비',
    icon: 'bowl_food',
  });
  const planId = await seedAnnualPlan(coupleId, year, uid);
  await seedAnnualPlanItem(coupleId, planId, {
    categoryId: foodCatId,
    group: 'expense',
    subGroup: 'variable_common',
    monthlyAmounts: Array(12).fill(300_000),
  });

  // 실제 내역: 지출 5만(식비) + 수입 300만(급여) — 모두 이번 달
  await seedCashbookEntry(coupleId, uid, {
    type: 'expense',
    amount: 50_000,
    category: '식비',
    description: '외식',
  });
  await seedCashbookEntry(coupleId, uid, {
    type: 'income',
    amount: 3_000_000,
    category: '정기급여',
    description: '월급',
  });
}

test.describe('월 점검 페이지', () => {
  test('내역 페이지의 점검 진입점으로 들어가면 예산 vs 실적 차트가 표시된다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedSettlementData(coupleId, uid);

    // 내역 페이지의 "내역 점검" 진입점
    await page.goto('/inner/cashbook/history');
    await page.getByTestId('history-review-link').click();

    await expect(page).toHaveURL(/\/inner\/cashbook\/review/);

    // 차트 2종 노출
    await expect(page.getByTestId('budget-vs-actual-chart')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('income-expense-pie')).toBeVisible();
  });

  test('AI 분석 버튼을 누르면 보고서가 표시되고 다운로드 버튼이 나타난다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedSettlementData(coupleId, uid);

    await page.goto('/inner/cashbook/review');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    // AI 분석 실행
    const analyzeBtn = page.getByTestId('ai-analyze-btn');
    await expect(analyzeBtn).toBeVisible();
    await analyzeBtn.click();

    // 보고서 mock 텍스트 노출
    // (dev 서버에서 API 라우트 첫 콜드 컴파일 시 요청이 실패할 수 있어 "다시 분석"으로 1회 복구)
    const report = page.getByTestId('ai-analysis-content');
    const retryBtn = page.getByTestId('ai-analyze-retry');
    await expect(report.or(retryBtn).first()).toBeVisible({ timeout: 10000 });
    if (!(await report.isVisible())) {
      await retryBtn.click();
    }
    await expect(report).toBeVisible({ timeout: 10000 });
    await expect(report).toContainText('지출 분석');

    // 보고서 markdown 다운로드 — 실제 download 이벤트 검증
    const mdDownload = page.getByTestId('settlement-md-download');
    await expect(mdDownload).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await mdDownload.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.md');

    // PDF 다운로드 버튼 노출 (캡처 동작은 headless 불안정 → 노출까지만 검증)
    await expect(page.getByTestId('settlement-pdf-download')).toBeVisible();

    // 차트별 개별 PNG 다운로드 버튼 노출 (예산·일별 차트는 시드 데이터로 렌더됨)
    await expect(page.getByTestId('settlement-png-download-budget')).toBeVisible();
    await expect(page.getByTestId('settlement-png-download-daily')).toBeVisible();
  });

  test('연간 계획이 없으면 예산 안내 빈 상태를 보여준다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    // 내역만 있고 예산(연간 계획) 없음
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 50_000,
      category: '식비',
      description: '외식',
    });

    await page.goto('/inner/cashbook/review');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    await expect(page.getByTestId('settlement-budget-empty')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('내역 페이지 AI 분석 제거 (회귀)', () => {
  test('내역 페이지에는 더 이상 AI 분석 버튼이 없다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 50_000,
      category: '식비',
      description: '외식',
    });

    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    await expect(page.getByTestId('ai-analyze-btn')).toHaveCount(0);
  });
});
