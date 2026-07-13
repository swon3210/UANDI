import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedCashflowSettings, seedCashbookEntry, seedPrediction } from '../helpers/emulator';
import { CashflowPage } from '../page-objects/CashflowPage';

// dayOfMonth의 다음 발생일(오늘 포함)을 정오로 만들어 타임존 경계를 피한다.
function nextOccurrence(dayOfMonth: number): Date {
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let d = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, 12, 0, 0);
  if (d < today0) d = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth, 12, 0, 0);
  return d;
}

function daysAgo(n: number): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 12, 0, 0).toISOString();
}

const PAYDAY = 15;

test.describe('현금흐름 사람별 잔액', () => {
  test('사람별 최초 현금을 설정하면 상단 히어로에 각자 오늘 잔액이 표시된다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedCashflowSettings(coupleId, {
      initialCashByUid: { [uid1]: 1000000, [uid2]: 500000 },
      paydays: [],
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    // 합계 = 150만, 각자 100만 / 50만.
    await expect(cashflow.baselineAmount).toHaveText('1,500,000원');
    const baselineMembers = cashflow.baselineCard.getByTestId('cashflow-member-balance');
    await expect(baselineMembers).toHaveCount(2);
    await expect(baselineMembers.filter({ hasText: '1,000,000원' })).toBeVisible();
    await expect(baselineMembers.filter({ hasText: '500,000원' })).toBeVisible();
  });

  test('작성자별 실거래는 각자 오늘 잔액에만 반영된다', async ({ twoUserAuthedContext }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    // 10일 전 기준, 각자 100만.
    await seedCashflowSettings(coupleId, {
      initialCashByUid: { [uid1]: 1000000, [uid2]: 1000000 },
      initialDate: daysAgo(10),
      paydays: [],
    });
    // uid1이 20만 지출, uid2가 30만 수입 기록.
    await seedCashbookEntry(coupleId, uid1, {
      type: 'expense',
      amount: 200000,
      category: '식비',
      date: daysAgo(5),
    });
    await seedCashbookEntry(coupleId, uid2, {
      type: 'income',
      amount: 300000,
      category: '용돈',
      date: daysAgo(3),
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    // 합계 = 100만+100만-20만+30만 = 210만.
    await expect(cashflow.baselineAmount).toHaveText('2,100,000원');
    // uid1 = 100만-20만 = 80만, uid2 = 100만+30만 = 130만.
    await expect(
      cashflow.baselineCard.locator(`[data-testid="cashflow-member-balance"][data-uid="${uid1}"]`)
    ).toContainText('800,000원');
    await expect(
      cashflow.baselineCard.locator(`[data-testid="cashflow-member-balance"][data-uid="${uid2}"]`)
    ).toContainText('1,300,000원');
  });

  test('카드에 각자 남는 돈이 표시되고, 합이 합계 잔액과 같다(공동 예측은 균등 분배)', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    // 기준일=오늘, 각자 100만.
    await seedCashflowSettings(coupleId, {
      initialCashByUid: { [uid1]: 1000000, [uid2]: 1000000 },
      paydays: [{ id: 'p1', label: '신한카드', dayOfMonth: PAYDAY }],
    });
    // uid1의 미래 확정 수입 50만(작성자 귀속).
    await seedCashbookEntry(coupleId, uid1, {
      type: 'income',
      amount: 500000,
      category: '정기급여',
      date: nextOccurrence(PAYDAY).toISOString(),
    });
    // 공동 예측 지출 70만(소유자 없음 → 균등 분배).
    await seedPrediction(coupleId, uid1, {
      type: 'expense',
      amount: 700000,
      category: '월세',
      date: nextOccurrence(PAYDAY).toISOString(),
      source: 'calendar',
      status: 'predicted',
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const first = cashflow.cards.first();
    // 합계 = 200만 + 50만 - 70만 = 180만.
    await expect(first.getByTestId('cashflow-card-balance')).toHaveText('1,800,000원');
    // uid1 = 100만 + 50만(본인 수입) - 35만(공동 절반) = 115만.
    // uid2 = 100만 - 35만(공동 절반) = 65만. 합 = 180만.
    const cardMembers = first.getByTestId('cashflow-member-balance');
    await expect(cardMembers).toHaveCount(2);
    await expect(
      first.locator(`[data-testid="cashflow-member-balance"][data-uid="${uid1}"]`)
    ).toContainText('1,150,000원');
    await expect(
      first.locator(`[data-testid="cashflow-member-balance"][data-uid="${uid2}"]`)
    ).toContainText('650,000원');
  });

  test('레거시(단일 최초 현금) 문서는 사람별로 균등 분배해 표시한다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, coupleId } = twoUserAuthedContext;
    // initialCashByUid 없이 합계 200만만 있는 문서 → 두 사람 100만씩 균등 분배.
    await seedCashflowSettings(coupleId, { initialCash: 2000000, paydays: [] });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    await expect(cashflow.baselineAmount).toHaveText('2,000,000원');
    const baselineMembers = cashflow.baselineCard.getByTestId('cashflow-member-balance');
    await expect(baselineMembers).toHaveCount(2);
    await expect(baselineMembers.filter({ hasText: '1,000,000원' })).toHaveCount(2);
  });

  test('설정 시트에서 사람별 최초 현금을 입력해 저장하면 각자 잔액에 반영된다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, coupleId } = twoUserAuthedContext;
    await seedCashflowSettings(coupleId, { initialCash: 0, paydays: [] });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    await cashflow.baselineCard.click();
    await cashflow.settingsSheet.waitFor({ state: 'visible' });
    // 멤버 순서대로 120만 / 80만 입력.
    await cashflow.fillSettingsPerPerson([1200000, 800000]);

    await expect(cashflow.baselineAmount).toHaveText('2,000,000원');
    const baselineMembers = cashflow.baselineCard.getByTestId('cashflow-member-balance');
    await expect(baselineMembers.filter({ hasText: '1,200,000원' })).toBeVisible();
    await expect(baselineMembers.filter({ hasText: '800,000원' })).toBeVisible();
  });
});
