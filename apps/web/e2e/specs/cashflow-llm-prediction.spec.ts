import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedDefaultCategories,
  seedCashflowSettings,
  seedCashbookCategory,
  seedCashbookEntry,
} from '../helpers/emulator';
import { CashflowPage } from '../page-objects/CashflowPage';

// AI 예측은 USE_AI_MOCK=true(.env.test)로 고정 응답을 반환한다:
//   - 지출 '외식' 120,000원 (호라이즌 시작 +10일)
//   - 수입 '부수입' 200,000원 (호라이즌 시작 +20일)
// declaredCategories(정기 발생 선언 카테고리)에 포함된 항목은 mock이 제외한다.

test.describe('현금흐름 LLM 예측', () => {
  test('진입 시 자동으로 예상 내역을 불러와 현금흐름(들어올/나갈/남는 돈)에 반영한다', async ({
    authedContext,
  }) => {
    const { coupleId, page } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    // 버튼을 누르지 않아도 자동으로 추론된다.
    await cashflow.waitForPredictionDone();
    await expect(cashflow.predictStatus).toContainText('2건');

    await cashflow.expandAllCards();

    // ◇ 예측 거래가 카드에 노출된다(외식/부수입).
    await expect(page.getByText('외식')).toBeVisible();
    await expect(page.getByText('부수입')).toBeVisible();

    // 잔액에 반영 — 보유 2,000,000 + 부수입 200,000 - 외식 120,000 = 2,080,000.
    await expect(
      page.getByTestId('cashflow-card-balance').filter({ hasText: '2,080,000' }).first()
    ).toBeVisible();
  });

  test('정기 발생으로 선언된 카테고리는 LLM 예측에서 제외된다', async ({ authedContext }) => {
    const { coupleId, page } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    // '외식'을 정기 지출로 선언 → mock이 declaredCategories로 받아 외식 예측을 빼고 1건만 반환.
    await seedCashbookCategory(coupleId, {
      group: 'expense',
      subGroup: 'fixed_expense',
      name: '외식',
      icon: '🍽️',
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: 15, expectedAmount: 120000 },
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    await cashflow.waitForPredictionDone();
    await expect(cashflow.predictStatus).toContainText('1건');

    await cashflow.expandAllCards();

    await expect(page.getByText('부수입')).toBeVisible();
    await expect(cashflow.llmPredictionRows.filter({ hasText: '외식' })).toHaveCount(0);
  });

  test('같은 달 실거래가 있는 카테고리의 LLM 예측은 가려진다(G1 — 잔액 이중계산 방지)', async ({
    authedContext,
  }) => {
    const { coupleId, uid, page } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    // mock 외식 예측일(호라이즌 시작 +10일)과 같은 달에 실거래가 있으면 외식 예측은 제외된다(G1).
    const predDate = new Date();
    predDate.setDate(predDate.getDate() + 10);
    predDate.setHours(12, 0, 0, 0);
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 30000,
      category: '외식',
      date: predDate.toISOString(),
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    await cashflow.waitForPredictionDone();
    await cashflow.expandAllCards();

    // 부수입은 보이지만 외식 예측은 G1으로 가려진다.
    await expect(page.getByText('부수입')).toBeVisible();
    await expect(cashflow.llmPredictionRows.filter({ hasText: '외식' })).toHaveCount(0);
  });

  test('한 번 추론하면 재방문 시 재추론하지 않고, "갱신"을 눌러야만 다시 추론한다', async ({
    authedContext,
  }) => {
    const { coupleId, page } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });

    let callCount = 0;
    await page.route('**/api/ai/predict-cashflow', async (route) => {
      callCount++;
      await route.continue();
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();
    await cashflow.waitForPredictionDone();
    expect(callCount).toBe(1); // 진입 시 자동 1회

    // 페이지를 다시 로드해도(캐시 영속) 재추론하지 않는다.
    await page.reload();
    await cashflow.waitForPredictionDone();
    expect(callCount).toBe(1);

    // "갱신"을 눌렀을 때만 다시 추론한다.
    await cashflow.refreshPrediction();
    expect(callCount).toBe(2);
  });
});
