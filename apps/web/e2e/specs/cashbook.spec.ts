import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedDefaultCategories,
  seedCashbookEntry,
} from '../helpers/emulator';
import { CashbookPage } from '../page-objects/CashbookPage';

test.describe('가계부', () => {
  test.describe('메인 화면', () => {
    test('월별 요약 카드에 수입/지출/잔액이 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      await seedCashbookEntry(coupleId, uid, {
        type: 'income',
        amount: 3000000,
        category: '정기급여',
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 50000,
        category: '식비',
      });

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      const summary = cashbook.monthlySummary;
      await expect(summary).toBeVisible();
      await expect(summary.getByText('+3,000,000원')).toBeVisible();
      await expect(summary.getByText('-50,000원')).toBeVisible();
      await expect(summary.getByText('2,950,000원')).toBeVisible();
    });

    test('내역이 없을 때 빈 상태가 표시된다', async ({ authedContext }) => {
      const { page } = authedContext;

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      await expect(page.getByText('아직 내역이 없어요')).toBeVisible();
    });
  });

  test.describe('내역 추가', () => {
    test('지출 내역을 추가하면 목록에 표시된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      await cashbook.addEntry({
        type: '지출',
        amount: 45000,
        category: '식비',
        description: '마트 장보기',
      });

      // 새로 추가된 항목 카드가 보여야 함
      const entryCards = page.locator('[data-testid^="entry-card-"]');
      await expect(entryCards.first()).toBeVisible();
      await expect(entryCards.first().getByText('식비')).toBeVisible();
      await expect(entryCards.first().getByText('-45,000원')).toBeVisible();
    });

    test('수입 내역을 추가하면 요약 카드에 반영된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      await cashbook.addEntry({
        type: '수입',
        amount: 3000000,
        category: '정기급여',
      });

      await expect(cashbook.monthlySummary.getByText('+3,000,000원')).toBeVisible();
    });
  });

  test.describe('월 이동', () => {
    test('이전/다음 달로 이동할 수 있다', async ({ authedContext }) => {
      const { page } = authedContext;

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      const now = new Date();
      const currentMonth = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
      await expect(cashbook.monthSelector).toContainText(currentMonth);

      // 이전 달로 이동
      await cashbook.prevMonthButton.click();
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1);
      const prevMonth = `${prevDate.getFullYear()}년 ${prevDate.getMonth() + 1}월`;
      await expect(cashbook.monthSelector).toContainText(prevMonth);

      // 다시 현재 달로 복귀
      await cashbook.nextMonthButton.click();
      await expect(cashbook.monthSelector).toContainText(currentMonth);
    });

    test('미래 달로 이동할 수 없다', async ({ authedContext }) => {
      const { page } = authedContext;

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      await expect(cashbook.nextMonthButton).toBeDisabled();
    });
  });

  test.describe('날짜별 그룹', () => {
    test('날짜별 그룹 헤더가 표시된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const today = new Date();
      const day15 = new Date(today.getFullYear(), today.getMonth(), 15);
      const day10 = new Date(today.getFullYear(), today.getMonth(), 10);

      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 10000,
        category: '식비',
        date: day15.toISOString(),
      });
      await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 20000,
        category: '교통',
        date: day10.toISOString(),
      });

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      await expect(page.getByText(`${today.getMonth() + 1}월 15일`)).toBeVisible();
      await expect(page.getByText(`${today.getMonth() + 1}월 10일`)).toBeVisible();
    });
  });

  test.describe('유효성 검사', () => {
    test('금액이 입력되지 않으면 저장 버튼이 비활성화된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      await cashbook.addButton.click();
      await cashbook.sheet.waitFor({ state: 'visible' });

      // 카테고리만 선택, 금액 미입력
      await cashbook.categoryChip('식비').click();

      await expect(cashbook.saveButton).toBeDisabled();
    });
  });

  test.describe('카테고리', () => {
    test('탭 전환 시 카테고리 목록이 변경된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      await cashbook.addButton.click();
      await cashbook.sheet.waitFor({ state: 'visible' });

      // 기본 탭(지출)에서 식비 칩 표시
      await expect(cashbook.categoryChip('식비')).toBeVisible();

      // 수입 탭으로 전환
      await cashbook.typeTab('수입').click();
      await expect(cashbook.categoryChip('식비')).not.toBeVisible();
      await expect(cashbook.categoryChip('정기급여')).toBeVisible();
    });

    test('직접 입력으로 커스텀 카테고리를 사용할 수 있다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      await cashbook.addButton.click();
      await cashbook.sheet.waitFor({ state: 'visible' });

      await cashbook.amountInput.fill('15000');
      await page.getByTestId('category-chip-custom').click();
      await page.getByTestId('custom-category-input').fill('커피');

      await cashbook.saveButton.click();

      const entryCards = page.locator('[data-testid^="entry-card-"]');
      await expect(entryCards.first()).toBeVisible();
      await expect(entryCards.first().getByText('커피')).toBeVisible();
    });
  });

  test.describe('내역 수정/삭제', () => {
    test('항목을 클릭해 수정하면 변경 사항이 반영된다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const entryId = await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 45000,
        category: '식비',
        description: '마트',
      });

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      // 항목 클릭으로 수정 시트 열기
      await cashbook.entryCard(entryId).click();
      await cashbook.sheet.waitFor({ state: 'visible' });

      // 금액 수정
      await cashbook.amountInput.clear();
      await cashbook.amountInput.fill('60000');
      await cashbook.saveButton.click();

      await expect(cashbook.entryCard(entryId).getByText('-60,000원')).toBeVisible();
    });

    test('항목을 삭제하면 목록에서 사라진다', async ({ authedContext }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      const entryId = await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 30000,
        category: '교통',
      });

      const cashbook = new CashbookPage(page);
      await cashbook.goto();

      await cashbook.entryCard(entryId).click();
      await cashbook.sheet.waitFor({ state: 'visible' });
      await cashbook.deleteButton.click();

      await expect(cashbook.entryCard(entryId)).not.toBeVisible();
    });
  });
});
