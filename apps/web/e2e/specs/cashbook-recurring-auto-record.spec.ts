import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  getCoupleMemberUids,
  seedCashbookCategory,
  seedCashbookEntry,
  seedDefaultCategories,
} from '../helpers/emulator';
import { CashbookCategoriesPage } from '../page-objects/CashbookCategoriesPage';
import { CashbookPage } from '../page-objects/CashbookPage';

// docs/pages/inner/cashbook-recurring-auto-record.md — 클라이언트에서 검증 가능한 범위.
// cron의 내역 생성 자체는 functions/test/recurrence-core.test.mjs(단위 테스트)로 분리.
test.describe('고정 지출·수입 자동 기록', () => {
  test.describe('카테고리 자동 기록 설정', () => {
    test('예상 금액이 없으면 자동 기록 토글이 비활성이고, 금액을 넣으면 켤 수 있다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');
      await categoriesPage.openEdit('월세');

      await categoriesPage.recurrenceSwitch.click();
      await categoriesPage.recurrenceKind('dayOfMonth').click();
      await categoriesPage.recurrenceDayInput.fill('25');

      // 금액 없음 → 비활성
      await expect(categoriesPage.autoRecordSwitch).toBeVisible();
      await expect(categoriesPage.autoRecordSwitch).toBeDisabled();

      // 금액 입력 → 활성
      await categoriesPage.recurrenceAmountInput.fill('800000');
      await expect(categoriesPage.autoRecordSwitch).toBeEnabled();
    });

    test('자동 기록을 켜면 기록자 칩이 노출되고 미리 알림 입력은 사라진다', async ({
      authedContext,
    }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);
      const [uidA, uidB] = await getCoupleMemberUids(coupleId);
      const partnerUid = uidA === uid ? uidB : uidA;

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');
      await categoriesPage.openEdit('월세');

      await categoriesPage.recurrenceSwitch.click();
      await categoriesPage.recurrenceDayInput.fill('25');
      await categoriesPage.recurrenceAmountInput.fill('800000');
      await expect(categoriesPage.recurrenceLeadInput).toBeVisible();

      await categoriesPage.autoRecordSwitch.click();

      // 기록자 칩 2개(나·짝꿍), 기본 선택 = 나
      await expect(categoriesPage.payerChip(uid)).toHaveAttribute('data-selected', 'true');
      await expect(categoriesPage.payerChip(partnerUid)).toHaveAttribute('data-selected', 'false');
      // 미리 알림은 자동 기록과 겹치므로 숨김(D8)
      await expect(categoriesPage.recurrenceLeadInput).toHaveCount(0);
    });

    test('자동 기록 + 기록자(짝꿍)를 저장하면 재편집 시 복원되고 목록 배지에 표시된다', async ({
      authedContext,
    }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);
      const [uidA, uidB] = await getCoupleMemberUids(coupleId);
      const partnerUid = uidA === uid ? uidB : uidA;

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');
      await categoriesPage.openEdit('월세');

      await categoriesPage.recurrenceSwitch.click();
      await categoriesPage.recurrenceDayInput.fill('25');
      await categoriesPage.recurrenceAmountInput.fill('800000');
      await categoriesPage.autoRecordSwitch.click();
      await categoriesPage.payerChip(partnerUid).click();
      await categoriesPage.saveButton.click();

      // 목록 배지에 "자동 기록" 표식
      await expect(categoriesPage.recurrenceBadge('월세')).toBeVisible();
      await expect(categoriesPage.autoRecordMark('월세')).toBeVisible();

      // 재편집 시 복원
      await categoriesPage.openEdit('월세');
      await expect(categoriesPage.autoRecordSwitch).toBeChecked();
      await expect(categoriesPage.payerChip(partnerUid)).toHaveAttribute('data-selected', 'true');
      await expect(categoriesPage.payerChip(uid)).toHaveAttribute('data-selected', 'false');
    });

    test('자동 기록이 켜진 상태에서 예상 금액을 지우면 토글이 꺼지고 다시 비활성이 된다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');
      await categoriesPage.openEdit('월세');

      await categoriesPage.recurrenceSwitch.click();
      await categoriesPage.recurrenceDayInput.fill('25');
      await categoriesPage.recurrenceAmountInput.fill('800000');
      await categoriesPage.autoRecordSwitch.click();
      await expect(categoriesPage.autoRecordSwitch).toBeChecked();

      await categoriesPage.recurrenceAmountInput.fill('');

      await expect(categoriesPage.autoRecordSwitch).not.toBeChecked();
      await expect(categoriesPage.autoRecordSwitch).toBeDisabled();
      // 미리 알림 입력이 다시 보인다
      await expect(categoriesPage.recurrenceLeadInput).toBeVisible();
    });

    test('자동 기록이 켜진 카테고리는 시드만으로도 목록 배지에 자동 기록 표식이 보인다', async ({
      authedContext,
    }) => {
      const { page, coupleId, uid } = authedContext;
      await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'fixed_expense',
        name: '구독',
        icon: 'tv',
        recurrence: {
          enabled: true,
          kind: 'dayOfMonth',
          dayOfMonth: 5,
          expectedAmount: 17000,
          autoRecord: true,
          payerUid: uid,
        },
      });

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      await expect(categoriesPage.recurrenceBadge('구독')).toContainText('매월 5일');
      await expect(categoriesPage.autoRecordMark('구독')).toBeVisible();
    });
  });

  test.describe('자동 기록된 내역 표시', () => {
    test('autoRecord 필드가 있는 내역에만 "자동" 배지가 붙는다', async ({ authedContext }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);

      const month = new Date().toISOString().slice(0, 7);
      const autoId = await seedCashbookEntry(coupleId, uid, {
        id: `recurrence-cat-rent-${month}`,
        type: 'expense',
        amount: 800000,
        category: '월세',
        autoRecord: { categoryId: 'cat-rent', month },
      });
      const manualId = await seedCashbookEntry(coupleId, uid, {
        type: 'expense',
        amount: 12000,
        category: '식비',
      });

      const cashbookPage = new CashbookPage(page);
      await cashbookPage.goto();

      await expect(
        cashbookPage.entryCard(autoId).getByTestId('entry-auto-record-badge')
      ).toBeVisible();
      await expect(
        cashbookPage.entryCard(manualId).getByTestId('entry-auto-record-badge')
      ).toHaveCount(0);
    });
  });

  test.describe('기록 완료 알림 딥링크 (entryId)', () => {
    test('entryId 딥링크로 진입하면 해당 내역의 편집 시트가 열린다', async ({ authedContext }) => {
      const { page, coupleId, uid } = authedContext;
      await seedDefaultCategories(coupleId);

      const month = new Date().toISOString().slice(0, 7);
      const entryId = await seedCashbookEntry(coupleId, uid, {
        id: `recurrence-cat-rent-${month}`,
        type: 'expense',
        amount: 800000,
        category: '월세',
        autoRecord: { categoryId: 'cat-rent', month },
      });

      await page.goto(`/inner/cashbook/history?entryId=${encodeURIComponent(entryId)}`);

      await expect(page.getByTestId('entry-form-sheet')).toBeVisible();
      await expect(page.getByLabel('금액')).toHaveValue('800000');
      await expect(page.getByTestId('category-breadcrumb')).toContainText('월세');

      // 처리 후 URL 정리(새로고침 시 다시 열리지 않음)
      await expect(page).toHaveURL(/\/inner\/cashbook\/history$/);
    });

    test('존재하지 않는 entryId면 안내 토스트가 뜨고 시트는 열리지 않는다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      await page.goto('/inner/cashbook/history?entryId=recurrence-none-2026-01');

      await expect(page.getByText('내역을 찾을 수 없어요')).toBeVisible();
      await expect(page.getByTestId('entry-form-sheet')).toHaveCount(0);
    });
  });
});
