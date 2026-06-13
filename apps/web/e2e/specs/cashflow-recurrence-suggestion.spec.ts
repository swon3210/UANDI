import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedCashflowSettings, seedCashbookCategory, seedCashbookEntry } from '../helpers/emulator';
import { CashflowPage } from '../page-objects/CashflowPage';

// Phase 6: 정기 발생을 선언하지 않은 반복 항목을 "정기 발생 등록 제안"으로 띄운다(영속 예측 doc 없음).
// 명세: docs/pages/inner/cashflow-recurrence-integration.md (Phase 6)

const TODAY = new Date();
// 말일 경계를 피해 모든 달에 존재하는 일자
const PATTERN_DAY = Math.min(TODAY.getDate(), 28);

function monthsAgoISO(months: number, day: number): string {
  return new Date(TODAY.getFullYear(), TODAY.getMonth() - months, day, 12, 0, 0).toISOString();
}

async function seedRecurringCommonBill(coupleId: string, uid: string) {
  for (const m of [1, 2, 3]) {
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 80000,
      category: '공과금',
      date: monthsAgoISO(m, PATTERN_DAY),
    });
  }
}

// 정기 발생을 켰지만 최근 2개월 발생이 끊긴 정기급여(해제 제안 후보).
async function seedStoppedRegularSalary(coupleId: string, uid: string) {
  await seedCashbookCategory(coupleId, {
    group: 'income',
    subGroup: 'regular_income',
    name: '정기급여',
    icon: 'wallet',
    recurrence: {
      enabled: true,
      kind: 'dayOfMonth',
      dayOfMonth: PATTERN_DAY,
      expectedAmount: 3000000,
    },
  });
  // 과거엔 발생했지만 최근 2개월은 끊김(3·4·5개월 전)
  for (const m of [3, 4, 5]) {
    await seedCashbookEntry(coupleId, uid, {
      type: 'income',
      amount: 3000000,
      category: '정기급여',
      date: monthsAgoISO(m, PATTERN_DAY),
    });
  }
}

test.describe('정기 발생 등록 제안 (Phase 6)', () => {
  test('미선언 반복 항목은 등록 제안으로 뜨고, 등록하면 캘린더 예측에 반영된다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    // 정기 발생 미설정 카테고리 + 과거 3개월 반복 내역
    await seedCashbookCategory(coupleId, {
      group: 'expense',
      subGroup: 'fixed_expense',
      name: '공과금',
      icon: 'receipt',
    });
    await seedRecurringCommonBill(coupleId, uid);

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const suggestion = page.getByTestId('recurrence-suggestion-card').filter({ hasText: '공과금' });
    await expect(suggestion).toBeVisible();
    await expect(suggestion).toHaveAttribute('data-kind', 'add');
    await expect(suggestion).toContainText('약 80,000원');
    // 등록 버튼이 명시적으로 "정기 지출 등록"
    await expect(suggestion.getByTestId('recurrence-suggestion-accept')).toContainText(
      '정기 지출 등록'
    );

    // 등록 → recurrence 설정 → 제안 사라지고 캘린더에 예측으로 노출
    await suggestion.getByTestId('recurrence-suggestion-accept').click();
    await expect(page.getByTestId('recurrence-suggestion-card')).toHaveCount(0);
    await expect(cashflow.cards.filter({ hasText: '공과금' }).first()).toBeVisible();
  });

  test('제안을 "안 함"으로 닫으면 사라지고, 재방문해도 다시 뜨지 않는다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    await seedCashbookCategory(coupleId, {
      group: 'expense',
      subGroup: 'fixed_expense',
      name: '공과금',
      icon: 'receipt',
    });
    await seedRecurringCommonBill(coupleId, uid);

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const suggestion = page.getByTestId('recurrence-suggestion-card').filter({ hasText: '공과금' });
    await expect(suggestion).toBeVisible();
    await suggestion.getByTestId('recurrence-suggestion-dismiss').click();
    await expect(page.getByTestId('recurrence-suggestion-card')).toHaveCount(0);

    // 재방문(영속 닫음)
    await cashflow.goto();
    await expect(page.getByTestId('recurrence-suggestion-card')).toHaveCount(0);
  });

  test('이미 정기 발생이 선언된 카테고리는 제안하지 않는다', async ({ authedContext }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 2000000, paydays: [] });
    await seedCashbookCategory(coupleId, {
      group: 'expense',
      subGroup: 'fixed_expense',
      name: '공과금',
      icon: 'receipt',
      recurrence: {
        enabled: true,
        kind: 'dayOfMonth',
        dayOfMonth: PATTERN_DAY,
        expectedAmount: 80000,
      },
    });
    await seedRecurringCommonBill(coupleId, uid);

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    // 카드 목록은 뜨지만 제안은 없다.
    await expect(cashflow.cardList).toBeVisible();
    await expect(page.getByTestId('recurrence-suggestion-card')).toHaveCount(0);
  });

  // Phase 7: 정기 발생이 끊긴 카테고리 → 해제 제안.
  test('정기 발생이 최근 발생하지 않으면 해제 제안이 뜨고, 해제하면 정기 발생이 제거된다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 5000000, paydays: [] });
    await seedStoppedRegularSalary(coupleId, uid);

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const card = page.getByTestId('recurrence-suggestion-card').filter({ hasText: '정기급여' });
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-kind', 'remove');
    await expect(card.getByTestId('recurrence-suggestion-accept')).toContainText('정기 수입 해제');

    // 해제 → recurrence 제거 → 제안 사라짐
    await card.getByTestId('recurrence-suggestion-accept').click();
    await expect(page.getByTestId('recurrence-suggestion-card')).toHaveCount(0);
  });

  test('해제 제안을 "유지"로 닫으면 사라지고, 재방문해도 다시 뜨지 않는다', async ({
    authedContext,
  }) => {
    const { page, uid, coupleId } = authedContext;
    await seedCashflowSettings(coupleId, { currentCash: 5000000, paydays: [] });
    await seedStoppedRegularSalary(coupleId, uid);

    const cashflow = new CashflowPage(page);
    await cashflow.goto();

    const card = page.getByTestId('recurrence-suggestion-card').filter({ hasText: '정기급여' });
    await expect(card).toBeVisible();
    await card.getByTestId('recurrence-suggestion-dismiss').click(); // 유지
    await expect(page.getByTestId('recurrence-suggestion-card')).toHaveCount(0);

    // 재방문(영속 닫음)
    await cashflow.goto();
    await expect(page.getByTestId('recurrence-suggestion-card')).toHaveCount(0);
  });
});
