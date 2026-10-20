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
  test('대시보드의 눈에 띄는 카테고리를 누르면 그 카테고리의 분석 페이지로 이동한다', async ({
    authedContext,
  }) => {
    // dev 서버에서 페이지·API 라우트를 처음 컴파일하면 20초 넘게 걸릴 수 있다
    test.slow();
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    for (const offset of [1, 2, 3]) {
      await seedMonth(coupleId, uid, offset, [
        ['식비', 30000],
        ['교통', 20000],
      ]);
    }
    await seedMonth(coupleId, uid, 0, [
      ['식비', 100000, '회식'],
      ['교통', 20000],
    ]);

    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.periodTabMonthly.click();
    await dashboard.groupTabExpense.click();
    await dashboard.medianHighlight('식비').click();

    await expect(page).toHaveURL(/\/inner\/cashbook\/analysis\?/, { timeout: 30000 });
    const analysis = new CategoryAnalysisPage(page);
    await expect(analysis.title).toContainText('식비');
    await expect(analysis.month).toContainText(dayjs().format('YYYY년 M월'));
    await expect(analysis.current).toContainText('100,000원');
    await expect(analysis.median).toContainText('30,000원');
    await expect(analysis.chart).toBeVisible();

    // 이번 달 내역 목록 (교통은 섞이지 않는다)
    await expect(analysis.entries).toContainText('회식');
    await expect(analysis.entries).toContainText('100,000원');
    await expect(analysis.entries).not.toContainText('교통');

    // AI 보고서(mock)는 자동으로 시작되고 카테고리 이름이 들어간다
    await expectReport(analysis);
    await expect(analysis.report).toContainText('식비');
    await expect(analysis.report).toContainText('평소와 비교');
    await expect(analysis.retry).toBeVisible();

    // 뒤로 가면 대시보드로 돌아온다
    await analysis.backButton.click();
    await expect(dashboard.medianCompare).toBeVisible({ timeout: 15000 });
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
    await dashboard.medianHighlight('식비').click();

    const prevMonth = dayjs().subtract(1, 'month');
    const analysis = new CategoryAnalysisPage(page);
    await expect(analysis.month).toContainText(prevMonth.format('YYYY년 M월'), {
      timeout: 30000,
    });
    await expect(analysis.current).toContainText('90,000원');
    await expect(analysis.median).toContainText('30,000원');
  });

  test('카테고리 정보 없이 들어오면 안내를 보여준다', async ({ authedPage }) => {
    const analysis = new CategoryAnalysisPage(authedPage);
    await analysis.goto('');
    await expect(analysis.empty).toBeVisible({ timeout: 15000 });
    await expect(analysis.report).toHaveCount(0);
  });
});
