import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedCashflowSettings, seedCashbookEntry } from '../helpers/emulator';
import { CashflowPage } from '../page-objects/CashflowPage';

const TODAY = new Date();
function daysAgoISO(days: number): string {
  return new Date(
    TODAY.getFullYear(),
    TODAY.getMonth(),
    TODAY.getDate() - days,
    12,
    0,
    0
  ).toISOString();
}

// 현금흐름 카드의 "예상 변동지출"(§7-2). 과거 변동지출 평균으로 추정 — 자동감지 예측 doc과는 무관.
test.describe('현금흐름 예상 변동지출 (§7-2)', () => {
  test('과거 변동지출이 있으면 카드에 예상 변동지출이 표시된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 3000000, paydays: [] });
    // 최근 한 달간 변동지출(고정 패턴 아님) 몇 건
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 120000,
      category: '식비',
      date: daysAgoISO(3),
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 90000,
      category: '식비',
      date: daysAgoISO(10),
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'flex',
      amount: 60000,
      category: '소비',
      date: daysAgoISO(18),
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();
    // 첫 카드(이번 주, 기본 펼침)에 예상 변동지출 줄
    await expect(page.getByTestId('cashflow-card-estimated-variable').first()).toBeVisible();
  });
});
