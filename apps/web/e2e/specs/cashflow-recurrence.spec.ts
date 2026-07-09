import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedCashflowSettings,
  seedCashbookCategory,
  seedCashbookEntry,
  seedPrediction,
} from '../helpers/emulator';
import { CashflowPage } from '../page-objects/CashflowPage';

// 고정 지출/수입 카테고리의 정기 발생(recurrence)이 현금흐름 캘린더 예측에 반영되는지 검증.
// 명세: docs/pages/inner/cashflow-recurrence-integration.md (Phase 1)

// recurrence dayOfMonth를 '오늘'로 두면 이번 달 발생일이 오늘 → 첫(가장 이른) 주 단위 카드에 떨어진다.
// 첫 카드는 기본 펼침 상태라 거래 배지가 바로 보인다.
const TODAY = new Date().getDate();

function todayNoonISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), TODAY, 12, 0, 0).toISOString();
}

function thisMonthDay1ISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0).toISOString();
}

test.describe('현금흐름 캘린더 — 정기 발생(recurrence) 통합', () => {
  test('고정 지출 카테고리의 정기 발생이 예측 지출(◇)로 반영되고 잔액에서 차감된다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    await seedCashbookCategory(coupleId, {
      group: 'expense',
      subGroup: 'fixed_expense',
      name: '월세',
      icon: 'house',
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: TODAY, expectedAmount: 500000 },
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const first = cashflow.cards.first();
    await expect(first).toBeVisible();
    // 예측(◇) 배지 + 카테고리명 노출
    await expect(first.getByTestId('cashflow-txn-badge-predicted')).toBeVisible();
    await expect(first).toContainText('월세');
    // 남는 돈 = 2,000,000 - 500,000
    await expect(first.getByTestId('cashflow-card-balance')).toHaveText('1,500,000원');
  });

  test('정기 수입 카테고리의 정기 발생이 예측 수입(◇)으로 반영되고 잔액에 더해진다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 1000000, paydays: [] });
    await seedCashbookCategory(coupleId, {
      group: 'income',
      subGroup: 'regular_income',
      name: '정기급여',
      icon: 'wallet',
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: TODAY, expectedAmount: 3000000 },
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const first = cashflow.cards.first();
    await expect(first.getByTestId('cashflow-txn-badge-predicted')).toBeVisible();
    await expect(first).toContainText('정기급여');
    // 남는 돈 = 1,000,000 + 3,000,000
    await expect(first.getByTestId('cashflow-card-balance')).toHaveText('4,000,000원');
  });

  test('같은 달에 실제 내역이 있으면 정기 발생 예측은 빠진다(이중계산 방지)', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    await seedCashbookCategory(coupleId, {
      group: 'expense',
      subGroup: 'fixed_expense',
      name: '월세',
      icon: 'house',
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: TODAY, expectedAmount: 500000 },
    });
    // 이번 달 실제 월세 내역(같은 카테고리) — 예측이 아니라 실거래로 잡혀야 한다.
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 500000,
      category: '월세',
      date: todayNoonISO(),
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const first = cashflow.cards.first();
    // 실거래(✓)만 있고 예측(◇)은 생성되지 않는다.
    await expect(first.getByTestId('cashflow-txn-badge-actual')).toBeVisible();
    await expect(first.getByTestId('cashflow-txn-badge-predicted')).toHaveCount(0);
    // 한 번만 차감 → 2,000,000 - 500,000 (이중계산이면 1,000,000이 됨)
    await expect(first.getByTestId('cashflow-card-balance')).toHaveText('1,500,000원');
  });

  test('예상 금액이 없는 정기 발생은 캘린더 예측에 들어가지 않는다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    await seedCashbookCategory(coupleId, {
      group: 'expense',
      subGroup: 'fixed_expense',
      name: '보험',
      icon: 'shield_check',
      // expectedAmount 없음 → 알림 대상이지만 금액 미상이라 잔액 예측에는 미반영
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: TODAY },
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const first = cashflow.cards.first();
    await expect(first).toBeVisible();
    await expect(first.getByTestId('cashflow-txn-badge-predicted')).toHaveCount(0);
    // 거래가 없으므로 잔액 = 현재 보유 현금 그대로
    await expect(first.getByTestId('cashflow-card-balance')).toHaveText('2,000,000원');
  });

  // 격월 정기 발생: 이번 달(anchor)엔 예측(◇)으로 뜨고, 근거 서브라벨에 "격월"이 표시된다.
  test('격월 정기 발생은 발생하는 달에 예측(◇)으로 뜨고 "격월" 근거가 표시된다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    const now = new Date();
    const anchorMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    await seedCashbookCategory(coupleId, {
      group: 'income',
      subGroup: 'regular_income',
      name: '상여',
      icon: 'wallet',
      // 이번 달을 anchor로 두면 이번 달은 발생월 → 오늘 날짜에 ◇로 뜬다(격월이라 다음 달은 건너뜀).
      recurrence: {
        enabled: true,
        kind: 'dayOfMonth',
        dayOfMonth: TODAY,
        expectedAmount: 1000000,
        intervalMonths: 2,
        anchorMonth,
      },
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const first = cashflow.cards.first();
    await expect(first.getByTestId('cashflow-txn-badge-predicted')).toBeVisible();
    await expect(first).toContainText('상여');
    // 예측 근거: 정기 발생 + 격월 표기
    await expect(first).toContainText('정기 발생');
    await expect(first).toContainText('격월');
    // 남는 돈 = 2,000,000 + 1,000,000 (이번 달 발생분만, 이중 아님)
    await expect(first.getByTestId('cashflow-card-balance')).toHaveText('3,000,000원');
  });

  // Phase 2: 정기 발생일이 결제일 없이도 카드 경계(날짜 체크포인트)가 된다.
  test('정기 발생일은 결제일 없이도 날짜 체크포인트 카드로 표시된다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    await seedCashbookCategory(coupleId, {
      group: 'expense',
      subGroup: 'fixed_expense',
      name: '월세',
      icon: 'house',
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: TODAY, expectedAmount: 500000 },
    });

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const first = cashflow.cards.first();
    // 주 단위 폴백('~' 라벨)이 아니라, 발생일 날짜 블록이 있는 체크포인트 카드가 된다.
    await expect(first.getByTestId('cashflow-card-date')).toBeVisible();
    await expect(first).toContainText('월세');
  });
});

// Phase 4: 정기 발생을 내역 페이지의 "예상 수입/지출" 프롬프트로도 읽기 시점에 파생.
test.describe('내역 페이지 정기 발생 프롬프트 (Phase 4)', () => {
  test('정기 발생 프롬프트는 기록하기·수정 후 기록을 노출하고 ✗(아니오)는 없다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    // 발생일을 오늘로 두면 이번 달 발생이 오늘(>= 오늘) → 이번 달 내역 화면에 프롬프트로 뜬다.
    await seedCashbookCategory(coupleId, {
      group: 'income',
      subGroup: 'regular_income',
      name: '정기급여',
      icon: 'wallet',
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: TODAY, expectedAmount: 3000000 },
    });

    await page.goto('/inner/cashbook/history');

    const prompt = page.getByTestId('prediction-prompt-box').filter({ hasText: '정기급여' });
    await expect(prompt).toBeVisible();
    await expect(prompt).toHaveAttribute('data-source', 'recurrence');
    await expect(prompt).toContainText('정기');
    // 기록하기(원탭) + 수정 후 기록(폼) — ✗(아니오)는 없음
    await expect(prompt.getByTestId('prediction-confirm')).toContainText('기록하기');
    await expect(prompt.getByTestId('prediction-edit')).toContainText('수정 후 기록');
    await expect(prompt.getByTestId('prediction-reject')).toHaveCount(0);
  });

  test('"기록하기"를 누르면 예상값 그대로 내역이 기록되고 프롬프트가 사라진다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedCashbookCategory(coupleId, {
      group: 'income',
      subGroup: 'regular_income',
      name: '정기급여',
      icon: 'wallet',
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: TODAY, expectedAmount: 3000000 },
    });

    await page.goto('/inner/cashbook/history');

    const prompt = page.getByTestId('prediction-prompt-box').filter({ hasText: '정기급여' });
    await expect(prompt).toBeVisible();
    await prompt.getByTestId('prediction-confirm').click();

    // 실거래로 기록 → 같은 달 G1로 프롬프트 사라지고, 내역에 +3,000,000원이 보인다.
    await expect(page.getByTestId('prediction-prompt-box')).toHaveCount(0);
    await expect(page.getByText('+3,000,000원').first()).toBeVisible();
  });

  test('"수정 후 기록"을 누르면 prefill된 입력 폼이 열린다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedCashbookCategory(coupleId, {
      group: 'income',
      subGroup: 'regular_income',
      name: '정기급여',
      icon: 'wallet',
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: TODAY, expectedAmount: 3000000 },
    });

    await page.goto('/inner/cashbook/history');

    const prompt = page.getByTestId('prediction-prompt-box').filter({ hasText: '정기급여' });
    await expect(prompt).toBeVisible();
    await prompt.getByTestId('prediction-edit').click();

    // prefill된 내역 추가 시트가 열리고 예상 금액이 채워져 있다.
    const sheet = page.getByTestId('entry-form-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByLabel('금액')).toHaveValue('3000000');
  });

  test('이번 달에 이미 기록한 정기 발생은 내역 페이지 프롬프트에서 빠진다(G1)', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashbookCategory(coupleId, {
      group: 'income',
      subGroup: 'regular_income',
      name: '정기급여',
      icon: 'wallet',
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: TODAY, expectedAmount: 3000000 },
    });
    // 이번 달 실제 급여 입력 → 정기 프롬프트는 빠져야 한다.
    await seedCashbookEntry(coupleId, uid, {
      type: 'income',
      amount: 3000000,
      category: '정기급여',
      date: todayNoonISO(),
    });

    await page.goto('/inner/cashbook/history');

    // 실거래는 목록에 보이고, 예상(정기) 프롬프트는 뜨지 않는다.
    await expect(page.getByText('정기급여').first()).toBeVisible();
    await expect(page.getByTestId('prediction-prompt-box')).toHaveCount(0);
  });

  test('잔존 auto 예측 doc이 있어도 정기 발생 프롬프트는 정상 표시된다(자동감지 제거)', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashbookCategory(coupleId, {
      group: 'income',
      subGroup: 'regular_income',
      name: '정기급여',
      icon: 'wallet',
      recurrence: { enabled: true, kind: 'dayOfMonth', dayOfMonth: TODAY, expectedAmount: 3000000 },
    });
    // 과거 자동감지가 남긴 같은 달 예측 doc — 이전엔 G2로 정기 프롬프트를 억제하던 버그.
    // 자동감지 제거(조회 단계 비활성) 후엔 무력화돼야 한다.
    await seedPrediction(coupleId, uid, {
      type: 'income',
      amount: 3000000,
      category: '정기급여',
      date: thisMonthDay1ISO(),
      source: 'auto',
      status: 'predicted',
      recurrenceKey: 'income|정기급여|1',
    });

    await page.goto('/inner/cashbook/history');

    // 정기 발생 프롬프트는 정상 노출되고,
    const prompt = page.getByTestId('prediction-prompt-box').filter({ hasText: '정기급여' });
    await expect(prompt).toBeVisible();
    await expect(prompt).toHaveAttribute('data-source', 'recurrence');
    // 잔존 auto doc은 '자동감지' 프롬프트로도 더는 뜨지 않는다.
    await expect(
      page.getByTestId('prediction-prompt-box').filter({ hasText: '자동감지' })
    ).toHaveCount(0);
  });
});
