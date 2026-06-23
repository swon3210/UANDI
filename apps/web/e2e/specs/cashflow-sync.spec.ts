import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedCashflowSettings,
  seedPrediction,
  seedCashbookEntry,
} from '../helpers/emulator';
import { CashbookPage } from '../page-objects/CashbookPage';
import { CashflowPage } from '../page-objects/CashflowPage';

// 오늘 정오 — 현재 달 & 오늘 이후 조건을 동시에 만족(타임존 경계 회피)
function todayNoonISO(): string {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0).toISOString();
}
test.describe('현금흐름 양방향 동기화', () => {
  test('SYNC-02: 예측이 있으면 가계부 해당 날짜에 점선 박스가 뜬다', async ({ authedContext }) => {
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

    await expect(cashbook.predictionPrompt).toBeVisible();
    await expect(cashbook.predictionPrompt).toContainText('월세');
    await expect(cashbook.predictionPrompt).toContainText('700,000원');
  });

  test('SYNC-03: ✓ 추가하면 정식 거래로 등록되고 점선 박스가 사라진다', async ({
    authedContext,
  }) => {
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

    await cashbook.predictionConfirm.click();

    // 점선 박스는 사라지고 일반 거래 행이 생긴다
    await expect(cashbook.predictionPrompt).toHaveCount(0);
    const entryCards = page.locator('[data-testid^="entry-card-"]');
    await expect(entryCards.first()).toBeVisible();
    await expect(entryCards.first()).toContainText('-700,000원');
  });

  test('SYNC-04: ✗ 아니오는 가계부 박스만 닫고 캘린더 예측은 유지한다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    await seedPrediction(coupleId, uid, {
      type: 'expense',
      amount: 500000,
      category: '카드값',
      date: todayNoonISO(),
      source: 'calendar',
      status: 'predicted',
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();
    await expect(cashbook.predictionPrompt).toBeVisible();
    await cashbook.predictionReject.click();
    await expect(cashbook.predictionPrompt).toHaveCount(0);

    // 캘린더에는 그대로 남아 잔액에 반영된다
    const cashflow = new CashflowPage(page);
    await cashflow.goto();
    await expect(cashflow.cards.first()).toContainText('500,000원');
  });

  test('SYNC-05: 캘린더에서 예측을 삭제하면 가계부 점선 박스도 사라진다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    await seedPrediction(coupleId, uid, {
      type: 'expense',
      amount: 300000,
      category: '구독료',
      date: todayNoonISO(),
      source: 'calendar',
      status: 'predicted',
    });

    // 가계부에 박스가 있는 상태 확인
    const cashbook = new CashbookPage(page);
    await cashbook.goto();
    await expect(cashbook.predictionPrompt).toBeVisible();

    // 캘린더에서 예측 삭제(첫 카드는 기본 펼침)
    const cashflow = new CashflowPage(page);
    await cashflow.goto();
    await cashflow.predictionDelete.first().click();

    // 가계부로 돌아오면 박스가 사라져 있다
    await cashbook.goto();
    await expect(cashbook.predictionPrompt).toHaveCount(0);
  });

  test('시나리오 E: ✎ 수정 후 추가로 금액을 바꿔 확정한다', async ({ authedContext }) => {
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

    await cashbook.predictionEdit.click();
    await cashbook.sheet.waitFor({ state: 'visible' });
    await cashbook.amountInput.clear();
    await cashbook.amountInput.fill('720000');
    await cashbook.saveButton.click();

    await expect(cashbook.predictionPrompt).toHaveCount(0);
    const entryCards = page.locator('[data-testid^="entry-card-"]');
    await expect(entryCards.first()).toContainText('-720,000원');
  });

  test('시나리오 C: 가계부에 직접 입력한 미래 확정 거래는 점선 박스가 생기지 않는다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 100000,
      category: '식비',
      date: todayNoonISO(),
    });

    const cashbook = new CashbookPage(page);
    await cashbook.goto();

    const entryCards = page.locator('[data-testid^="entry-card-"]');
    await expect(entryCards.first()).toContainText('-100,000원');
    await expect(cashbook.predictionPrompt).toHaveCount(0);
  });

  // (제거됨) "캘린더에서 예측을 직접 추가" 흐름은 폐지됐다(수동 추가 UI 제거).
  // 예측 생성은 이제 카테고리 정기 발생 선언 또는 LLM 예측(읽기 시점)으로 대체된다.
});
