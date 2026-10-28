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

    // 이번 달 내역은 선택한 카테고리만
    await expect(analysis.entries).toContainText('회식');
    await expect(analysis.entries).toContainText('버스');
    await expect(analysis.entries).not.toContainText('기차');

    // AI 리포트는 카테고리마다가 아니라 하나만, 선택한 카테고리를 모두 다룬다
    await expectReport(analysis);
    await expect(analysis.report).toHaveCount(1);
    await expect(analysis.report).toContainText('식비');
    await expect(analysis.report).toContainText('교통');
    await expect(analysis.retry).toBeVisible();

    // 뒤로 가면 대시보드로 돌아오고 선택도 유지된다
    await analysis.backButton.click();
    await expect(dashboard.compareSummaryCaption).toContainText('2개', { timeout: 15000 });
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
  });

  test('분석 범위 정보 없이 들어오면 안내를 보여준다', async ({ authedPage }) => {
    const analysis = new CategoryAnalysisPage(authedPage);
    await analysis.goto('');
    await expect(analysis.empty).toBeVisible({ timeout: 15000 });
    await expect(analysis.report).toHaveCount(0);
  });
});
