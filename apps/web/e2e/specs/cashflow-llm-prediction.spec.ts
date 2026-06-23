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
// 단, declaredCategories(정기 발생 선언 카테고리)에 포함된 항목은 mock이 제외한다.

test.describe('현금흐름 LLM 예측', () => {
  test('AI로 예측 보기 → 예상 내역이 카드에 표시되고 잔액엔 반영되지 않는다', async ({
    authedContext,
  }) => {
    const { coupleId, page } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    await cashflow.runPrediction();
    await expect(cashflow.predictResult).toContainText('2건');

    await cashflow.expandAllCards();

    // "AI 예상 내역" 섹션에 두 예측이 ◇로 노출된다(외식/부수입은 서로 다른 날짜 카드에 들어간다).
    await expect(cashflow.llmPredictions.first()).toBeVisible();
    await expect(page.getByText('AI 예상 내역').first()).toBeVisible();
    await expect(page.getByText('외식')).toBeVisible();
    await expect(page.getByText('부수입')).toBeVisible();

    // 표시 전용 — 잔액(남는 돈)은 보유 현금 그대로다(예측이 더해지면 2,080,000이 됐을 것).
    await expect(cashflow.cards.first().getByTestId('cashflow-card-balance')).toContainText(
      '2,000,000'
    );
    await expect(page.getByTestId('cashflow-card-balance').filter({ hasText: '2,080,000' })).toHaveCount(
      0
    );
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

    await cashflow.runPrediction();
    await expect(cashflow.predictResult).toContainText('1건');

    await cashflow.expandAllCards();

    await expect(cashflow.llmPredictions.first()).toBeVisible();
    await expect(page.getByText('부수입')).toBeVisible();
    // 외식은 선언 카테고리라 AI 예상 내역에 없다.
    await expect(cashflow.llmPredictions.filter({ hasText: '외식' })).toHaveCount(0);
  });

  test('같은 달 실거래가 있어도 LLM 예측은 그대로 표시된다(표시 전용 — G1 미적용)', async ({
    authedContext,
  }) => {
    const { coupleId, uid, page } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    // 예측은 잔액에 반영되지 않는 "참고용"이라, 같은 달 실거래가 있어도 가리지 않는다(앞으로 더 쓸 수 있음).
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

    await cashflow.runPrediction();
    await cashflow.expandAllCards();

    // 실거래가 있어도 외식 LLM 예측이 그대로 노출된다.
    await expect(page.getByText('부수입')).toBeVisible();
    await expect(cashflow.llmPredictions.filter({ hasText: '외식' }).first()).toBeVisible();
  });
});
