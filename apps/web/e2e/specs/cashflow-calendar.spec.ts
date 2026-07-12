import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedCashflowSettings,
  seedLegacyCashflowSettings,
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
    // 실제 폼과 동일하게 type 없이 결제일을 심는다(날짜 블록이 type에 의존하지 않아야 함).
    await seedCashflowSettings(coupleId, {
      currentCash: 2000000,
      paydays: [{ id: 'p1', label: '신한카드', dayOfMonth: PAYDAY }],
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
    // 결제일 카드에는 날짜 블록이 보여야 한다(type 미지정이어도)
    await expect(first.getByTestId('cashflow-card-date')).toBeVisible();
    // 남는 돈 = 2,000,000 - 700,000
    await expect(first.getByTestId('cashflow-card-balance')).toHaveText('1,300,000원');
    // 나갈 돈 = 700,000 (예측 ◇ 포함)
    await expect(first).toContainText('700,000원');
  });

  test('같은 날짜의 결제일은 한 카드로 묶여 표시된다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, {
      currentCash: 3000000,
      paydays: [
        { id: 'p1', label: '대출이자', dayOfMonth: PAYDAY },
        { id: 'p2', label: '관리비', dayOfMonth: PAYDAY },
      ],
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    // 첫(가장 가까운) 결제일 카드에 두 이벤트가 함께 묶여 보인다 (날짜별 카드는 1개)
    const first = cashflow.cards.first();
    await expect(first).toContainText('대출이자');
    await expect(first).toContainText('관리비');
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
    // Phase 2: 결제일 수동 입력이 폐지돼 최초 현금(기준일 기본=오늘)만 저장한다.
    await cashflow.fillSettings({ initialCash: 1500000 });

    // 결제일/정기 발생이 없으면 주 단위 카드로 폴백해 카드가 나타난다.
    await expect(cashflow.cardList).toBeVisible();
    await expect(cashflow.cards.first()).toBeVisible();
  });

  test('상단 오늘 예상 현금 카드에 금액이 보이고, 눌러서 바로 수정할 수 있다(설정 아이콘 불필요)', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    // 기준일=오늘, 누적 거래 없음 → 오늘 예상 현금 = 최초 현금.
    await seedCashflowSettings(coupleId, { initialCash: 2000000, paydays: [] });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    // 오늘 예상 현금이 페이지 상단에 크게 노출된다.
    await expect(cashflow.baselineCard).toBeVisible();
    await expect(cashflow.baselineAmount).toHaveText('2,000,000원');
    await expect(cashflow.baselineCard).toContainText('최초 현금');

    // 기어 아이콘을 거치지 않고, 카드를 눌러 바로 설정 시트를 연다.
    await cashflow.baselineCard.click();
    await expect(cashflow.settingsSheet).toBeVisible();

    // 금액을 바꿔 저장하면 상단 카드에 즉시 반영된다.
    await cashflow.fillSettings({ initialCash: 3500000 });
    await expect(cashflow.baselineAmount).toHaveText('3,500,000원');
  });

  test('최초 현금 + 기준일 이후 실제 거래를 더해 오늘 예상 현금을 자동 계산한다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    // 10일 전 기준으로 최초 현금 100만원 설정.
    const now = new Date();
    const daysAgo = (n: number) =>
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 12, 0, 0);
    await seedCashflowSettings(coupleId, {
      initialCash: 1000000,
      initialDate: daysAgo(10).toISOString(),
      paydays: [],
    });
    // 기준일 이후~오늘 직전에 실제 지출 30만 / 수입 50만이 기록됨.
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 300000,
      category: '식비',
      date: daysAgo(5).toISOString(),
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'income',
      amount: 500000,
      category: '용돈',
      date: daysAgo(3).toISOString(),
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    // 오늘 예상 현금 = 100만 - 30만 + 50만 = 120만. 최초 현금(100만)은 보조 라벨로 노출.
    await expect(cashflow.baselineAmount).toHaveText('1,200,000원');
    await expect(cashflow.baselineCard).toContainText('1,000,000원');
  });

  test('레거시(currentCash) 설정 문서는 최초 현금으로 승계되고 기준일 이후 거래를 누적한다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    const now = new Date();
    const daysAgo = (n: number) =>
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 12, 0, 0);
    // initialCash/initialDate 없이 currentCash=200만만 있던 옛 문서(updatedAt=7일 전).
    await seedLegacyCashflowSettings(coupleId, {
      currentCash: 2000000,
      updatedAt: daysAgo(7).toISOString(),
    });
    // 기준일(=updatedAt) 이후 지출 10만이 기록됨 → 오늘 잔액 = 200만 - 10만.
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 100000,
      category: '생활비',
      date: daysAgo(3).toISOString(),
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    // 설정 안내가 아니라 정상 카드/히어로가 뜨고, 승계된 최초 현금(200만)에서 누적해 190만이 된다.
    await expect(cashflow.baselineCard).toBeVisible();
    await expect(cashflow.baselineAmount).toHaveText('1,900,000원');
    await expect(cashflow.baselineCard).toContainText('2,000,000원');
  });

  test('가계부 캘린더 탭으로 현금흐름 캘린더에 진입할 수 있다', async ({ authedContext }) => {
    const { page } = authedContext;

    await page.goto('/inner/cashbook/history');
    await page.getByTestId('cashbook-tab-cashflow').click();

    await page.waitForURL('**/inner/cashbook/cashflow');
    await expect(page.getByTestId('cashflow-settings-button')).toBeVisible();
  });
});
