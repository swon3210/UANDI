import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedCashflowSettings, seedCashbookEntry, seedPrediction } from '../helpers/emulator';
import { CashflowPage } from '../page-objects/CashflowPage';

// 사람별 최초 현금은 설정 시트에서 멤버별로 입력하지만, 화면에는 합계만 보여준다.
// (히어로·카드의 "각자 잔액" 칩은 UI 단순화를 위해 제거됐다.)

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

test.describe('현금흐름 사람별 최초 현금', () => {
  test('사람별 최초 현금을 설정하면 히어로에는 합계만 표시되고 사람별 칩은 없다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    await seedCashflowSettings(coupleId, {
      initialCashByUid: { [uid1]: 1000000, [uid2]: 500000 },
      paydays: [],
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    // 합계 = 150만.
    await expect(cashflow.baselineAmount).toHaveText('1,500,000원');
    await expect(page.getByTestId('cashflow-member-balance')).toHaveCount(0);
    await expect(cashflow.baselineCard).not.toContainText('1,000,000원');
  });

  test('작성자가 다른 실거래도 모두 합계 오늘 잔액에 반영된다', async ({
    twoUserAuthedContext,
  }) => {
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
  });

  test('카드에는 합계 남는 돈만 표시되고 각자 남는 돈 칩은 없다', async ({
    twoUserAuthedContext,
  }) => {
    const { page, uid1, uid2, coupleId } = twoUserAuthedContext;
    // 기준일=오늘, 각자 100만.
    await seedCashflowSettings(coupleId, {
      initialCashByUid: { [uid1]: 1000000, [uid2]: 1000000 },
      paydays: [{ id: 'p1', label: '신한카드', dayOfMonth: PAYDAY }],
    });
    // uid1의 미래 확정 수입 50만.
    await seedCashbookEntry(coupleId, uid1, {
      type: 'income',
      amount: 500000,
      category: '정기급여',
      date: nextOccurrence(PAYDAY).toISOString(),
    });
    // 공동 예측 지출 70만.
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
    await expect(first).not.toContainText('각자 남는 돈');
    await expect(page.getByTestId('cashflow-member-balance')).toHaveCount(0);
  });

  test('레거시(단일 최초 현금) 문서도 합계가 그대로 표시된다', async ({ twoUserAuthedContext }) => {
    const { page, coupleId } = twoUserAuthedContext;
    // initialCashByUid 없이 합계 200만만 있는 문서.
    await seedCashflowSettings(coupleId, { initialCash: 2000000, paydays: [] });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    await expect(cashflow.baselineAmount).toHaveText('2,000,000원');
    await expect(page.getByTestId('cashflow-member-balance')).toHaveCount(0);
  });

  test('설정 시트에서 사람별 최초 현금을 입력해 저장하면 합계에 반영된다', async ({
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
    // 재진입 시 멤버별 입력값이 복원된다(저장은 사람별, 표시는 합계).
    await cashflow.baselineCard.click();
    await cashflow.settingsSheet.waitFor({ state: 'visible' });
    await expect(cashflow.initialCashInputs.nth(0)).toHaveValue('1200000');
    await expect(cashflow.initialCashInputs.nth(1)).toHaveValue('800000');
  });
});
