import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedPrediction } from '../helpers/emulator';
import { CashbookPage } from '../page-objects/CashbookPage';

function daysAgoNoonISO(days: number): string {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate() - days, 12, 0, 0).toISOString();
}
function todayNoonISO(): string {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0).toISOString();
}

test.describe('현금흐름 회고 배너 (SYNC-06)', () => {
  test('지난 미처리 예측은 다음날 회고 배너로 뜬다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedPrediction(coupleId, uid, {
      type: 'expense',
      amount: 700000,
      category: '월세',
      date: daysAgoNoonISO(1), // 어제
      source: 'calendar',
      status: 'predicted',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await expect(cashbook.retroBanner).toBeVisible();
    await expect(cashbook.retroBanner).toContainText('월세');
    await expect(cashbook.retroBanner).toContainText('700,000원');
  });

  test('오늘 날짜 예측은 아직 회고에 뜨지 않는다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedPrediction(coupleId, uid, {
      type: 'expense',
      amount: 700000,
      category: '월세',
      date: todayNoonISO(),
      source: 'calendar',
      status: 'predicted',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    await expect(cashbook.retroBanner).toHaveCount(0);
  });

  test('회고에서 ✓(네)를 누르면 항목이 처리되어 사라진다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedPrediction(coupleId, uid, {
      type: 'expense',
      amount: 700000,
      category: '월세',
      date: daysAgoNoonISO(1),
      source: 'calendar',
      status: 'predicted',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();
    await expect(cashbook.retroItem).toHaveCount(1);

    await cashbook.retroConfirm.click();
    await expect(cashbook.retroBanner).toHaveCount(0);
  });

  test('회고에서 ✗(아니오)를 누르면 항목이 사라진다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedPrediction(coupleId, uid, {
      type: 'expense',
      amount: 700000,
      category: '월세',
      date: daysAgoNoonISO(1),
      source: 'calendar',
      status: 'predicted',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();
    await expect(cashbook.retroItem).toHaveCount(1);

    await cashbook.retroReject.click();
    await expect(cashbook.retroBanner).toHaveCount(0);
  });

  test('회고를 닫으면 같은 날 다시 진입해도 뜨지 않는다 (매일 1회)', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedPrediction(coupleId, uid, {
      type: 'expense',
      amount: 700000,
      category: '월세',
      date: daysAgoNoonISO(1),
      source: 'calendar',
      status: 'predicted',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();
    await expect(cashbook.retroBanner).toBeVisible();

    await cashbook.retroDismiss.click();
    await expect(cashbook.retroBanner).toHaveCount(0);

    // 같은 날 재진입(새로고침) 시에도 뜨지 않는다
    await page.reload();
    await expect(cashbook.retroBanner).toHaveCount(0);
  });
});
