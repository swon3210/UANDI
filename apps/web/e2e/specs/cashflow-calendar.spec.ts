import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedCashflowSettings,
  seedPrediction,
  seedCashbookEntry,
} from '../helpers/emulator';
import { CashflowPage } from '../page-objects/CashflowPage';

// dayOfMonth의 다음 발생일(오늘 포함)을 정오로 만들어 타임존 경계를 피한다.
function nextOccurrence(dayOfMonth: number): Date {
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let d = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, 12, 0, 0);
  if (d < today0) d = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth, 12, 0, 0);
  return d;
}

const PAYDAY = 15; // 테스트용 결제일(매월 15일)

test.describe('현금흐름 캘린더', () => {
  test('결제일 카드에 들어올/나갈/남는 돈이 누적 계산되어 표시된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, {
      currentCash: 2000000,
      paydays: [{ id: 'p1', label: '신한카드', type: 'card', dayOfMonth: PAYDAY }],
    });
    await seedPrediction(coupleId, uid, {
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
    await expect(first).toBeVisible();
    await expect(first).toContainText('신한카드');
    // 남는 돈 = 2,000,000 - 700,000
    await expect(first.getByTestId('cashflow-card-balance')).toHaveText('1,300,000원');
    // 나갈 돈 = 700,000 (예측 ◇ 포함)
    await expect(first).toContainText('700,000원');
  });

  test('남는 돈이 음수면 빨갛게 강조되고 음수 경고 배너가 뜬다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, {
      currentCash: 100000,
      paydays: [{ id: 'p1', label: '신한카드', type: 'card', dayOfMonth: PAYDAY }],
    });
    await seedPrediction(coupleId, uid, {
      type: 'expense',
      amount: 500000,
      category: '카드값',
      date: nextOccurrence(PAYDAY).toISOString(),
      source: 'calendar',
      status: 'predicted',
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const first = cashflow.cards.first();
    await expect(first).toHaveAttribute('data-negative', 'true');
    await expect(first.getByTestId('cashflow-card-balance')).toHaveText('-400,000원');
    await expect(cashflow.negativeBanner).toBeVisible();
    await expect(cashflow.negativeBanner).toContainText('부족');
  });

  test('카드를 펼치면 확정(✓)·예측(◇) 배지가 붙은 거래가 보인다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, {
      currentCash: 2000000,
      paydays: [{ id: 'p1', label: '신한카드', type: 'card', dayOfMonth: PAYDAY }],
    });
    // 미래 확정 수입(SYNC-01: 가계부에 직접 입력한 미래 거래가 캘린더에 반영)
    await seedCashbookEntry(coupleId, uid, {
      type: 'income',
      amount: 3000000,
      category: '정기급여',
      date: nextOccurrence(PAYDAY).toISOString(),
    });
    // 예측 지출
    await seedPrediction(coupleId, uid, {
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
    // 첫 카드는 기본 펼침
    await expect(first.getByTestId('cashflow-txn-badge-actual')).toBeVisible();
    await expect(first.getByTestId('cashflow-txn-badge-predicted')).toBeVisible();
    // 남는 돈 = 2,000,000 + 3,000,000 - 700,000
    await expect(first.getByTestId('cashflow-card-balance')).toHaveText('4,300,000원');
  });

  test('결제일이 없으면 주 단위 카드로 묶어서 보여준다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 1000000, paydays: [] });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    await expect(cashflow.cardList).toBeVisible();
    await expect(cashflow.cards.first()).toBeVisible();
    // 주 단위 라벨은 "M월 D일 ~ M월 D일" 형태
    await expect(cashflow.cards.first()).toContainText('~');
  });

  test('설정이 없으면 안내 화면을 띄우고, 설정 저장 후 카드가 나타난다', async ({
    authedContext,
  }) => {
    const { page } = authedContext;

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    await expect(page.getByText('현금흐름을 보려면 설정이 필요해요')).toBeVisible();

    await cashflow.setupButton.click();
    await cashflow.settingsSheet.waitFor({ state: 'visible' });
    await cashflow.fillSettings({
      currentCash: 1500000,
      payday: { label: '월세', day: PAYDAY },
    });

    await expect(cashflow.cardList).toBeVisible();
    await expect(cashflow.cards.first()).toContainText('월세');
  });

  test('가계부 더보기 메뉴에서 현금흐름 캘린더로 이동할 수 있다', async ({ authedContext }) => {
    const { page } = authedContext;

    await page.goto('/inner/cashbook/history');
    await page.getByTestId('cashbook-more-menu').click();
    await page.getByTestId('menu-cashflow').click();

    await page.waitForURL('**/inner/cashbook/cashflow');
    await expect(page.getByText('현금흐름 캘린더')).toBeVisible();
  });
});
