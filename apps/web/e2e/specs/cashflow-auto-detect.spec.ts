import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedCashflowSettings,
  seedCashbookEntry,
  seedPrediction,
} from '../helpers/emulator';
import { CashbookPage } from '../page-objects/CashbookPage';
import { CashflowPage } from '../page-objects/CashflowPage';

const TODAY = new Date();
// 말일 경계를 피하려고 28 이하로 고정 — 모든 달에 존재하는 일자
const PATTERN_DAY = Math.min(TODAY.getDate(), 28);

function monthsAgoISO(months: number, day: number): string {
  return new Date(TODAY.getFullYear(), TODAY.getMonth() - months, day, 12, 0, 0).toISOString();
}
function daysAgoISO(days: number): string {
  return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - days, 12, 0, 0).toISOString();
}
function plus31ISO(): string {
  return new Date(TODAY.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString();
}

test.describe('현금흐름 자동 예측 (§7)', () => {
  test('3개월 반복 고정지출이 자동감지 예측으로 생성된다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    // 결제일을 패턴 일자에 두면 자동 예측이 첫(기본 펼침) 카드에 잡힌다
    await seedCashflowSettings(coupleId, {
      currentCash: 5000000,
      paydays: [{ id: 'p1', label: '카드', type: 'card', dayOfMonth: PATTERN_DAY }],
    });
    for (const m of [1, 2, 3]) {
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 700000,
        category: '월세',
        date: monthsAgoISO(m, PATTERN_DAY),
      });
    }

    // 가계부 진입 → 자동 감지 실행(예측 쓰기)
    const cashbook = new CashbookPage(page);
    await cashbook.goto();
    // fire-and-forget 쓰기가 커밋될 시간을 준 뒤 캘린더로 이동(신규 fetch)
    await page.waitForTimeout(1200);

    const cashflow = new CashflowPage(page);
    await cashflow.goto();
    const first = cashflow.cards.first();
    await expect(first).toContainText('700,000원');
    await expect(first).toContainText('자동감지');
    await expect(first).toContainText('월세');
  });

  test('✗ 거절된 자동 예측은 30일간 다시 제안되지 않는다 (시나리오 B)', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, {
      currentCash: 5000000,
      paydays: [{ id: 'p1', label: '카드', type: 'card', dayOfMonth: PATTERN_DAY }],
    });
    for (const m of [1, 2, 3]) {
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 700000,
        category: '월세',
        date: monthsAgoISO(m, PATTERN_DAY),
      });
    }
    // 이미 거절된(30일 게이트 활성) 같은 패턴의 예측을 미리 심는다
    await seedPrediction(coupleId, uid, {
      type: 'expense',
      amount: 700000,
      category: '월세',
      date: plus31ISO(),
      source: 'auto',
      status: 'rejected',
      recurrenceKey: `expense|월세|${PATTERN_DAY}`,
      rejectedUntil: plus31ISO(),
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();
    await page.waitForTimeout(1200);

    // 게이트로 인해 새 예측이 만들어지지 않아 캘린더에 월세 금액이 없다
    const cashflow = new CashflowPage(page);
    await cashflow.goto();
    await expect(cashflow.cards.filter({ hasText: '700,000원' })).toHaveCount(0);
    // 가계부에도 점선 박스가 없다
    await cashbook.goto();
    await expect(cashbook.predictionPrompt).toHaveCount(0);
  });

  test('§7-2: 과거 변동지출이 있으면 카드에 예상 변동지출이 표시된다', async ({
    authedContext,
  }) => {
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
