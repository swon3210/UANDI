import { expect } from '@playwright/test';
import dayjs from 'dayjs';
import { test } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects/DashboardPage';
import { CategoryAnalysisPage } from '../page-objects/CategoryAnalysisPage';
import { seedCashbookEntry, seedDefaultCategories } from '../helpers/emulator';

/** offset개월 전 달의 1일 정오로 내역을 시드한다 (0 = 이번 달) */
async function seedMonth(
  coupleId: string,
  uid: string,
  offset: number,
  rows: Array<[string, number, string?]>
) {
  const date = dayjs().subtract(offset, 'month').startOf('month').add(12, 'hour').toISOString();
  for (const [category, amount, description] of rows) {
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount,
      category,
      description,
      date,
    });
  }
}

/** 지난 3개월: 식비 30k·교통 20k·여행 50k, 이번 달: 식비 100k(회식)·교통 20k(버스)·여행 10k(기차) */
async function seedThreeCategories(coupleId: string, uid: string) {
  await seedDefaultCategories(coupleId);
  for (const offset of [1, 2, 3]) {
    await seedMonth(coupleId, uid, offset, [
      ['식비', 30000],
      ['교통', 20000],
      ['여행', 50000],
    ]);
  }
  await seedMonth(coupleId, uid, 0, [
    ['식비', 100000, '회식'],
    ['교통', 20000, '버스'],
    ['여행', 10000, '기차'],
  ]);
}

async function openVariableExpense(page: DashboardPage['page']) {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await dashboard.periodTabMonthly.click();
  await dashboard.groupTabExpense.click();
  await dashboard.subGroupTab('변동 지출').click();
  return dashboard;
}

async function selectCategories(dashboard: DashboardPage, names: string[]) {
  await dashboard.compareCategoryButton.click();
  for (const name of names) await dashboard.compareCategoryOption(name).click();
  await dashboard.compareCategoryApply.click();
  await expect(dashboard.compareCategorySheet).toBeHidden();
}

/**
 * AI 보고서가 보일 때까지 기다린다.
 * dev 서버에서 API 라우트 첫 콜드 컴파일 시 요청이 실패할 수 있어 "다시 분석"으로 1회 복구한다.
 */
async function expectReport(analysis: CategoryAnalysisPage) {
  await expect(analysis.report.or(analysis.retry).first()).toBeVisible({ timeout: 30000 });
  if (!(await analysis.report.isVisible())) {
    await analysis.retry.click();
  }
  await expect(analysis.report).toBeVisible({ timeout: 30000 });
}

/** 대시보드 AI 요약에 AI 한 줄 이유가 붙을 때까지 기다린다 (첫 콜드 컴파일 실패 시 다시 시도 1회) */
async function expectSummary(dashboard: DashboardPage, category: string) {
  const reason = dashboard.compareAiSummaryReason(category);
  await expect(reason.or(dashboard.compareAiSummaryRetry).first()).toBeVisible({
    timeout: 30000,
  });
  if (!(await reason.isVisible())) {
    await dashboard.compareAiSummaryRetry.click();
  }
  await expect(reason).toBeVisible({ timeout: 30000 });
}

test.describe('대시보드 AI 요약', () => {
  test('기간 비교 아래에 변화가 큰 카테고리를 증감 막대와 AI 한 줄 이유로 보여준다', async ({
    authedContext,
  }) => {
    test.slow();
    const { page, uid, coupleId } = authedContext;
    await seedThreeCategories(coupleId, uid);

    const dashboard = await openVariableExpense(page);
    await selectCategories(dashboard, ['식비', '교통']);

    // 변화가 큰 순: 식비(▲7만원) → 교통(변동 없음)
    const items = dashboard.compareAiSummary.locator('[data-testid^="compare-ai-summary-item-"]');
    await expect(items).toHaveCount(2, { timeout: 15000 });
    await expect(items.first()).toContainText('식비');
    await expect(dashboard.compareAiSummaryItem('식비')).toContainText('▲ 7만원');

    // 카테고리마다 AI 한 줄 이유 (리포트의 다른 섹션 문장은 없음)
    await expectSummary(dashboard, '식비');
    await expect(dashboard.compareAiSummaryReason('식비')).toContainText('몰렸어요');
    await expect(dashboard.compareAiSummary).not.toContainText('큰 금액 한두 건');
    // 총평 두 문장: ① 총 증감과 그 원인 카테고리 ② 늘어난·줄어든 카테고리
    await expect(dashboard.compareAiSummaryOverall).toContainText('총 7만원 늘었어요');
    await expect(dashboard.compareAiSummaryOverall).toContainText('식비(▲7만원)');
    await expect(dashboard.compareAiSummaryOverall).toContainText('식비는 늘었어요');

    // 전체 리포트는 같은 분석을 다시 쓰므로 바로 보인다
    await dashboard.compareAiAnalysis.click();
    const analysis = new CategoryAnalysisPage(page);
    await expect(analysis.report).toBeVisible({ timeout: 30000 });
    await expect(analysis.report).toContainText('큰 금액 한두 건');
  });

  test('카테고리를 바꾸면 그 범위로 요약을 다시 만든다', async ({ authedContext }) => {
    test.slow();
    const { page, uid, coupleId } = authedContext;
    await seedThreeCategories(coupleId, uid);

    const dashboard = await openVariableExpense(page);
    await selectCategories(dashboard, ['식비']);
    await expectSummary(dashboard, '식비');
    await expect(dashboard.compareAiSummaryItem('여행')).toHaveCount(0);

    await selectCategories(dashboard, ['여행']);
    await expect(dashboard.compareAiSummaryItem('여행')).toContainText('▼ 4만원');
    // 카테고리마다 비교 대상(전월)과 이번 달 막대 두 줄: 여행 5만원 → 1만원
    await expect(dashboard.compareAiSummaryBar('여행', 'compare')).toContainText('5만원');
    await expect(dashboard.compareAiSummaryBar('여행', 'current')).toContainText('1만원');
    await expect(dashboard.compareAiSummaryBar('식비', 'compare')).toContainText('3만원');
    await expect(dashboard.compareAiSummaryBar('식비', 'current')).toContainText('10만원');
    await expectSummary(dashboard, '여행');
    // 식비 ▲7만원 + 여행 ▼4만원 = 총 3만원 증가, 원인은 식비
    await expect(dashboard.compareAiSummaryOverall).toContainText('총 3만원 늘었어요');
    await expect(dashboard.compareAiSummaryOverall).toContainText('식비는 늘고 여행은 줄었어요');
  });
});

test.describe('카테고리 AI 분석 페이지', () => {
  test('기간 비교에서 고른 카테고리들을 하나의 종합 리포트로 분석한다', async ({
    authedContext,
  }) => {
    // dev 서버에서 페이지·API 라우트를 처음 컴파일하면 20초 넘게 걸릴 수 있다
    test.slow();
    const { page, uid, coupleId } = authedContext;
    await seedThreeCategories(coupleId, uid);

    const dashboard = await openVariableExpense(page);
    await selectCategories(dashboard, ['식비', '교통']);
    await dashboard.compareAiAnalysis.click();

    await expect(page).toHaveURL(/\/inner\/cashbook\/analysis\?/, { timeout: 30000 });
    const analysis = new CategoryAnalysisPage(page);
    await expect(analysis.chip('식비')).toBeVisible();
    await expect(analysis.chip('교통')).toBeVisible();
    await expect(analysis.chip('여행')).toHaveCount(0);
    await expect(analysis.month).toContainText(dayjs().format('YYYY년 M월'));

    // 선택한 카테고리 합계(식비+교통)를 대시보드의 비교 대상(기본: 전월)과 비교한다
    await expect(analysis.current).toContainText('120,000원');
    await expect(analysis.compareLabel).toContainText(
      dayjs().subtract(1, 'month').format('YYYY년 M월')
    );
    await expect(analysis.compare).toContainText('50,000원');
    await expect(analysis.delta).toContainText('70,000');
    await expect(analysis.chart).toBeVisible();

    // 카테고리별 내역
    await expect(analysis.row('식비')).toContainText('100,000');
    await expect(analysis.row('식비')).toContainText('30,000');
    await expect(analysis.row('교통')).toContainText('20,000');
    await expect(analysis.row('여행')).toHaveCount(0);

    // 이번 달 내역 목록은 보여주지 않는다 (너무 길어서 — AI가 눈에 띄는 내역만 짚는다)
    await expect(analysis.entries).toHaveCount(0);

    // 추이는 묶음 전체가 기본, 카테고리를 고르면 그 카테고리 추이와 평소 점선
    await expect(analysis.trendCaption).toContainText('전체');
    await expect(analysis.trendCaption).toContainText('50,000원');
    await analysis.trendFilter('식비').click();
    await expect(analysis.trendCaption).toContainText('식비');
    await expect(analysis.trendCaption).toContainText('30,000원');
    await analysis.trendFilter('전체').click();
    await expect(analysis.trendCaption).toContainText('50,000원');

    // AI 리포트는 카테고리마다가 아니라 하나만, 선택한 카테고리를 모두 다룬다
    await expectReport(analysis);
    await expect(analysis.report).toHaveCount(1);
    await expect(analysis.report).toContainText('요약');
    await expect(analysis.report).toContainText('식비');
    await expect(analysis.report).toContainText('교통');
    // 요약은 그래프에 이미 보이는 합계를 되풀이하지 않는다
    await expect(analysis.report).not.toContainText('120,000원');
    await expect(analysis.retry).toBeVisible();

    // 뒤로 가면 대시보드로 돌아오고 선택도 유지된다
    await analysis.backButton.click();
    await expect(dashboard.compareSummaryCaption).toContainText('2개', { timeout: 15000 });
  });

  test('분석 페이지에서 카테고리를 다시 골라 그 묶음으로 분석한다', async ({ authedContext }) => {
    test.slow();
    const { page, uid, coupleId } = authedContext;
    await seedThreeCategories(coupleId, uid);

    const dashboard = await openVariableExpense(page);
    await selectCategories(dashboard, ['식비', '교통']);
    await dashboard.compareAiAnalysis.click();

    const analysis = new CategoryAnalysisPage(page);
    await expect(analysis.current).toContainText('120,000원', { timeout: 30000 });

    // 범위의 카테고리가 모두 후보로 나오고, 고른 것은 체크돼 있다
    await analysis.categoryButton.click();
    await expect(analysis.categorySheet).toBeVisible();
    await expect(analysis.categoryOption('식비')).toHaveAttribute('data-state', 'selected');
    await analysis.categoryOption('여행').click();
    await analysis.categoryApply.click();
    await expect(analysis.categorySheet).toBeHidden();

    await expect(page).toHaveURL(/cat=%EC%97%AC%ED%96%89/);
    await expect(analysis.chip('여행')).toBeVisible();
    await expect(analysis.current).toContainText('130,000원');
    await expectReport(analysis);
    await expect(analysis.report).toContainText('여행');

    // 모두 해제하면 범위 전체(전체 변동 지출)
    await analysis.categoryButton.click();
    await analysis.categoryClear.click();
    await analysis.categoryApply.click();
    await expect(analysis.title).toContainText('전체 변동 지출');
    await expect(analysis.chip('식비')).toHaveCount(0);
  });

  test('평소와 비교 중이었다면 평소(중위값) 기준으로 분석한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedThreeCategories(coupleId, uid);

    const dashboard = await openVariableExpense(page);
    await dashboard.comparePeriodButton.click();
    await dashboard.compareTargetMedian.click();
    await selectCategories(dashboard, ['식비', '여행']);
    await dashboard.compareAiAnalysis.click();

    const analysis = new CategoryAnalysisPage(page);
    await expect(analysis.compareLabel).toContainText('평소', { timeout: 30000 });
    // 이번 달 110,000 vs 평소 80,000 (식비 30k + 여행 50k)
    await expect(analysis.current).toContainText('110,000원');
    await expect(analysis.compare).toContainText('80,000원');
    await expect(analysis.row('여행')).toContainText('50,000');
  });

  test('카테고리를 고르지 않았다면 보고 있던 범위 전체를 분석한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedThreeCategories(coupleId, uid);
    await seedMonth(coupleId, uid, 0, [['월세', 700000, '10월 월세']]);

    const dashboard = await openVariableExpense(page);
    await dashboard.compareAiAnalysis.click();

    const analysis = new CategoryAnalysisPage(page);
    await expect(analysis.title).toContainText('전체 변동 지출', { timeout: 30000 });
    // 고정 지출(월세)은 빠진다
    await expect(analysis.current).toContainText('130,000원');
    await expect(analysis.row('식비')).toBeVisible();
    await expect(analysis.row('여행')).toBeVisible();
    await expect(analysis.row('월세')).toHaveCount(0);
  });

  test('카테고리별로는 변화가 큰 5개만 보여준다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const names = ['월세', '보험', '식비', '교통', '여행', '소비'];
    await seedMonth(
      coupleId,
      uid,
      1,
      names.map((name) => [name, 10000])
    );
    // 변화량: 월세 +100k > 보험 +80k > 식비 +60k > 교통 +40k > 여행 +20k > 소비 +5k
    const increases = [100000, 80000, 60000, 40000, 20000, 5000];
    await seedMonth(
      coupleId,
      uid,
      0,
      names.map((name, i) => [name, 10000 + increases[i]])
    );

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.periodTabMonthly.click();
    await dashboard.groupTabExpense.click();

    // 대시보드 요약도 변화가 큰 5개만
    const items = dashboard.compareAiSummary.locator('[data-testid^="compare-ai-summary-item-"]');
    await expect(items).toHaveCount(5, { timeout: 15000 });
    await expect(items.first()).toContainText('월세');
    await expect(dashboard.compareAiSummaryItem('소비')).toHaveCount(0);

    await dashboard.compareAiAnalysis.click();
    const analysis = new CategoryAnalysisPage(page);
    await expect(analysis.breakdown).toBeVisible({ timeout: 30000 });
    await expect(analysis.breakdown).toContainText('6개 중 큰 변화 5개');
    await expect(analysis.breakdown.locator('[data-testid^="category-analysis-row-"]')).toHaveCount(
      5
    );
    await expect(
      analysis.breakdown.locator('[data-testid^="category-analysis-row-"]').first()
    ).toContainText('월세');
    await expect(analysis.row('소비')).toHaveCount(0);
    // 추이 필터에는 범위의 카테고리가 모두 있다
    await expect(analysis.trendFilter('소비')).toBeVisible();
  });

  test('지난 달을 보고 있었다면 그 달 기준으로 분석한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    for (const offset of [2, 3, 4]) {
      await seedMonth(coupleId, uid, offset, [['식비', 30000]]);
    }
    await seedMonth(coupleId, uid, 1, [['식비', 90000]]);
    await seedMonth(coupleId, uid, 0, [['식비', 10000]]);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.periodTabMonthly.click();
    await dashboard.groupTabExpense.click();
    await dashboard.periodPrevButton.click();
    await dashboard.compareAiAnalysis.click();

    const prevMonth = dayjs().subtract(1, 'month');
    const analysis = new CategoryAnalysisPage(page);
    await expect(analysis.month).toContainText(prevMonth.format('YYYY년 M월'), {
      timeout: 30000,
    });
    await expect(analysis.title).toContainText('전체 지출');
    await expect(analysis.current).toContainText('90,000원');
    await expect(analysis.compare).toContainText('30,000원');
  });

  test('연간 탭에서는 AI 분석 진입 버튼이 없다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedThreeCategories(coupleId, uid);

    const dashboard = await openVariableExpense(page);
    await expect(dashboard.compareAiAnalysis).toBeVisible({ timeout: 10000 });
    await dashboard.periodTabYearly.click();
    await expect(dashboard.trendChart).toBeVisible();
    await expect(dashboard.compareAiAnalysis).toHaveCount(0);
    await expect(dashboard.compareAiSummary).toHaveCount(0);
  });

  test('분석 범위 정보 없이 들어오면 안내를 보여준다', async ({ authedPage }) => {
    const analysis = new CategoryAnalysisPage(authedPage);
    await analysis.goto('');
    await expect(analysis.empty).toBeVisible({ timeout: 15000 });
    await expect(analysis.report).toHaveCount(0);
  });
});
