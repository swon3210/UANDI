import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories, seedCashbookEntry } from '../helpers/emulator';
import { CashbookPage } from '../page-objects/CashbookPage';

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

test.describe('가계부 내역 필터', () => {
  test('지출 타입으로 좁히면 수입 항목이 사라진다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const incomeId = await seedCashbookEntry(coupleId, uid, {
      type: 'income',
      amount: 3000000,
      category: '정기급여',
    });
    const expenseId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await expect(cashbook.entryCard(incomeId)).toBeVisible();
    await expect(cashbook.entryCard(expenseId)).toBeVisible();

    await cashbook.openFilter();
    await cashbook.typeFilter('expense').click();
    await cashbook.applyFilter();

    await expect(cashbook.entryCard(expenseId)).toBeVisible();
    await expect(cashbook.entryCard(incomeId)).not.toBeVisible();
  });

  test('카테고리 선택 시 다른 카테고리 항목은 숨겨진다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const sikbiId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });
    const trafficId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '교통',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await cashbook.openFilter();
    await cashbook.typeFilter('expense').click();
    await cashbook.categoryTrigger.click();
    await cashbook.categoryOption('식비').click();
    await cashbook.applyFilter();

    await expect(cashbook.entryCard(sikbiId)).toBeVisible();
    await expect(cashbook.entryCard(trafficId)).not.toBeVisible();
  });

  test('카테고리 2개 선택 시 둘 다 포함된다(OR 조건)', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const sikbiId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });
    const trafficId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '교통',
    });
    const monthlyRentId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 700000,
      category: '월세',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await cashbook.openFilter();
    await cashbook.typeFilter('expense').click();
    await cashbook.categoryTrigger.click();
    await cashbook.categoryOption('식비').click();
    await cashbook.categoryOption('교통').click();
    await cashbook.applyFilter();

    await expect(cashbook.entryCard(sikbiId)).toBeVisible();
    await expect(cashbook.entryCard(trafficId)).toBeVisible();
    await expect(cashbook.entryCard(monthlyRentId)).not.toBeVisible();
  });

  test('시트 초기화 버튼은 선택한 조건을 모두 해제한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const sikbiId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });
    const trafficId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '교통',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await cashbook.openFilter();
    await cashbook.typeFilter('expense').click();
    await cashbook.categoryTrigger.click();
    await cashbook.categoryOption('식비').click();
    await cashbook.applyFilter();

    await expect(cashbook.entryCard(trafficId)).not.toBeVisible();

    await cashbook.openFilter();
    await cashbook.resetButton.click();
    await cashbook.applyFilter();

    await expect(cashbook.entryCard(sikbiId)).toBeVisible();
    await expect(cashbook.entryCard(trafficId)).toBeVisible();
  });

  test('인라인 화살표로 이전/다음 달을 이동할 수 있다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);

    const thisMonthId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });
    const lastMonthId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '교통',
      date: lastMonth.toISOString(),
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await expect(cashbook.entryCard(thisMonthId)).toBeVisible();
    await expect(cashbook.entryCard(lastMonthId)).not.toBeVisible();

    await cashbook.prevMonthButton.click();
    const lastLabel = `${lastMonth.getFullYear()}년 ${lastMonth.getMonth() + 1}월`;
    await expect(cashbook.periodLabel).toHaveText(lastLabel);
    await expect(cashbook.entryCard(lastMonthId)).toBeVisible();
    await expect(cashbook.entryCard(thisMonthId)).not.toBeVisible();

    await cashbook.nextMonthButton.click();
    await expect(cashbook.entryCard(thisMonthId)).toBeVisible();
    await expect(cashbook.entryCard(lastMonthId)).not.toBeVisible();
  });

  test('이번 달에서는 다음 달 화살표가 비활성화된다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await expect(cashbook.nextMonthButton).toBeDisabled();
  });

  test('지난달 프리셋으로 전환하면 지난달 내역이 표시된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);

    const sikbiThisMonthId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });
    const trafficLastMonthId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '교통',
      date: lastMonth.toISOString(),
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    // 기본(이번 달): 이번 달 내역만 조회됨
    await expect(cashbook.entryCard(sikbiThisMonthId)).toBeVisible();
    await expect(cashbook.entryCard(trafficLastMonthId)).not.toBeVisible();

    await cashbook.openFilter();
    await cashbook.periodPreset('lastMonth').click();
    await cashbook.applyFilter();

    await expect(cashbook.entryCard(trafficLastMonthId)).toBeVisible();
    await expect(cashbook.entryCard(sikbiThisMonthId)).not.toBeVisible();
  });

  test('최근 3개월 프리셋은 3개월 이내 내역만 포함한다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    const today = new Date();
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 15);
    const fourMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 4, 15);

    const thisMonthId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 1000,
      category: '식비',
    });
    const twoMonthsAgoId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 2000,
      category: '교통',
      date: twoMonthsAgo.toISOString(),
    });
    const fourMonthsAgoId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '월세',
      date: fourMonthsAgo.toISOString(),
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await cashbook.openFilter();
    await cashbook.periodPreset('last3Months').click();
    await cashbook.applyFilter();

    await expect(cashbook.entryCard(thisMonthId)).toBeVisible();
    await expect(cashbook.entryCard(twoMonthsAgoId)).toBeVisible();
    await expect(cashbook.entryCard(fourMonthsAgoId)).not.toBeVisible();
  });

  test('직접 선택 기간은 여러 달에 걸쳐 조회된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    const today = new Date();
    const thisMonthDay10 = new Date(today.getFullYear(), today.getMonth(), 10);
    const lastMonthDay20 = new Date(today.getFullYear(), today.getMonth() - 1, 20);
    const lastMonthFirst = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const thisMonthId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 1000,
      category: '식비',
      date: thisMonthDay10.toISOString(),
    });
    const lastMonthId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 2000,
      category: '교통',
      date: lastMonthDay20.toISOString(),
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    // 기본(이번 달)에서는 지난달 항목 미표시
    await expect(cashbook.entryCard(lastMonthId)).not.toBeVisible();

    await cashbook.openFilter();
    await cashbook.periodPreset('custom').click();
    await cashbook.periodStart.fill(ymd(lastMonthFirst));
    await cashbook.periodEnd.fill(ymd(thisMonthEnd));
    await cashbook.applyFilter();

    await expect(cashbook.entryCard(thisMonthId)).toBeVisible();
    await expect(cashbook.entryCard(lastMonthId)).toBeVisible();
  });

  test('키워드로 메모를 검색하면 일치하는 내역만 표시된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const martId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
      description: '마트 장보기',
    });
    const gasId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 60000,
      category: '교통',
      description: '주유소',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await cashbook.openFilter();
    await cashbook.keywordInput.fill('마트');
    await cashbook.applyFilter();

    await expect(cashbook.entryCard(martId)).toBeVisible();
    await expect(cashbook.entryCard(gasId)).not.toBeVisible();
  });

  test('키워드는 카테고리명에도 매칭되며 대소문자를 구분하지 않는다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const cafeId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 5000,
      category: 'Cafe',
    });
    const travelId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 100000,
      category: 'Travel',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await cashbook.openFilter();
    await cashbook.keywordInput.fill('cafe');
    await cashbook.applyFilter();

    await expect(cashbook.entryCard(cafeId)).toBeVisible();
    await expect(cashbook.entryCard(travelId)).not.toBeVisible();
  });

  test('정렬을 오래된순으로 바꾸면 날짜 오름차순으로 표시된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    const today = new Date();
    const day10 = new Date(today.getFullYear(), today.getMonth(), 10);
    const day20 = new Date(today.getFullYear(), today.getMonth(), 20);

    const olderId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 1000,
      category: '식비',
      date: day10.toISOString(),
    });
    const newerId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 2000,
      category: '교통',
      date: day20.toISOString(),
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await expect(cashbook.entryCard(newerId)).toBeVisible();
    await expect(cashbook.entryCard(olderId)).toBeVisible();

    const cardOrder = () =>
      page
        .locator('[data-testid^="entry-card-"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));

    // 기본 최신순: 20일(newer)이 먼저
    const latest = await cardOrder();
    expect(latest.indexOf(`entry-card-${newerId}`)).toBeLessThan(
      latest.indexOf(`entry-card-${olderId}`)
    );

    // 오래된순으로 전환
    await cashbook.sortSelect.click();
    await page.getByRole('option', { name: '오래된순' }).click();

    await expect
      .poll(async () => {
        const order = await cardOrder();
        return (
          order.indexOf(`entry-card-${olderId}`) < order.indexOf(`entry-card-${newerId}`)
        );
      })
      .toBe(true);
  });

  test('금액순으로 정렬할 수 있다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    const cheapId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 5000,
      category: '식비',
    });
    const pricyId = await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 500000,
      category: '월세',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    const cardOrder = () =>
      page
        .locator('[data-testid^="entry-card-"]')
        .evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));

    await cashbook.sortSelect.click();
    await page.getByRole('option', { name: '높은 금액순' }).click();
    await expect
      .poll(async () => {
        const o = await cardOrder();
        return o.indexOf(`entry-card-${pricyId}`) < o.indexOf(`entry-card-${cheapId}`);
      })
      .toBe(true);

    await cashbook.sortSelect.click();
    await page.getByRole('option', { name: '낮은 금액순' }).click();
    await expect
      .poll(async () => {
        const o = await cardOrder();
        return o.indexOf(`entry-card-${cheapId}`) < o.indexOf(`entry-card-${pricyId}`);
      })
      .toBe(true);
  });

  test('필터 결과가 0건이면 전용 빈 상태가 표시된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await cashbook.openFilter();
    await cashbook.typeFilter('income').click();
    await cashbook.applyFilter();

    await expect(page.getByText('조건에 맞는 내역이 없어요')).toBeVisible();
  });

  test('필터 활성 시 요약 카드에 필터 결과 보조 라인이 표시된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 3000,
      category: '교통',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await expect(cashbook.filterResultSummary).toBeHidden();

    await cashbook.openFilter();
    await cashbook.typeFilter('expense').click();
    await cashbook.categoryTrigger.click();
    await cashbook.categoryOption('식비').click();
    await cashbook.applyFilter();

    await expect(cashbook.filterResultSummary).toBeVisible();
    await expect(cashbook.filterResultSummary).toContainText('45,000');
  });

  test('적용한 조건 개수가 필터 버튼 배지에 표시된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 45000,
      category: '식비',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await expect(cashbook.filterCount).toBeHidden();

    await cashbook.openFilter();
    await cashbook.typeFilter('expense').click();
    await cashbook.categoryTrigger.click();
    await cashbook.categoryOption('식비').click();
    await cashbook.applyFilter();

    await expect(cashbook.filterCount).toHaveText('2');
  });
});
