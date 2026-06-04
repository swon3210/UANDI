import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories } from '../helpers/emulator';
import { CashbookCategoriesPage } from '../page-objects/CashbookCategoriesPage';
import { NotificationSettingsPage } from '../page-objects/NotificationSettingsPage';

test.describe('고정 지출·수입 정기 알림', () => {
  test.describe('카테고리 정기 발생 설정', () => {
    test('고정 지출(월세) 편집 시트에는 정기 발생 섹션이 노출된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      await categoriesPage.openEdit('월세');

      await expect(categoriesPage.recurrenceSection).toBeVisible();
      await expect(categoriesPage.recurrenceSwitch).toBeVisible();
    });

    test('변동 지출(식비)에는 정기 발생 섹션이 노출되지 않는다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      await categoriesPage.openEdit('식비');

      await expect(categoriesPage.sheet).toBeVisible();
      await expect(categoriesPage.recurrenceSection).toHaveCount(0);
    });

    test('매월 며칠 + 예상 금액을 저장하면 재편집 시 복원된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      // 월세에 매월 25일 · 예상 800,000원 설정
      await categoriesPage.openEdit('월세');
      await categoriesPage.recurrenceSwitch.click();
      await categoriesPage.recurrenceKind('dayOfMonth').click();
      await categoriesPage.recurrenceDayInput.fill('25');
      await categoriesPage.recurrenceAmountInput.fill('800000');
      await categoriesPage.saveButton.click();

      // 재오픈 시 값 복원
      await categoriesPage.openEdit('월세');
      await expect(categoriesPage.recurrenceSwitch).toBeChecked();
      await expect(categoriesPage.recurrenceDayInput).toHaveValue('25');
      await expect(categoriesPage.recurrenceAmountInput).toHaveValue('800000');
    });

    test('매월 몇째 주 요일을 저장하면 재편집 시 복원된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      // 보험에 둘째 주 수요일 설정
      await categoriesPage.openEdit('보험');
      await categoriesPage.recurrenceSwitch.click();
      await categoriesPage.recurrenceKind('nthWeekday').click();
      await categoriesPage.recurrenceWeekButton(2).click();
      await categoriesPage.recurrenceWeekdayButton(3).click(); // 수요일
      await categoriesPage.saveButton.click();

      // 재오픈 시 선택 복원
      await categoriesPage.openEdit('보험');
      await expect(categoriesPage.recurrenceSwitch).toBeChecked();
      await expect(categoriesPage.recurrenceWeekButton(2)).toHaveAttribute('data-selected', 'true');
      await expect(categoriesPage.recurrenceWeekdayButton(3)).toHaveAttribute(
        'data-selected',
        'true'
      );
    });

    test('고정 수입(정기급여)도 정기 발생을 설정할 수 있다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      // 수입 탭이 기본

      await categoriesPage.openEdit('정기급여');
      await expect(categoriesPage.recurrenceSection).toBeVisible();
      await categoriesPage.recurrenceSwitch.click();
      await categoriesPage.recurrenceKind('dayOfMonth').click();
      await categoriesPage.recurrenceDayInput.fill('10');
      await categoriesPage.saveButton.click();

      await categoriesPage.openEdit('정기급여');
      await expect(categoriesPage.recurrenceDayInput).toHaveValue('10');
    });

    test('정기 발생을 저장하면 카테고리 카드에 배지가 표시된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      await categoriesPage.openEdit('월세');
      await categoriesPage.recurrenceSwitch.click();
      await categoriesPage.recurrenceKind('dayOfMonth').click();
      await categoriesPage.recurrenceDayInput.fill('25');
      await categoriesPage.saveButton.click();

      await expect(categoriesPage.recurrenceBadge('월세')).toContainText('매월 25일');
    });
  });

  test.describe('알림 설정', () => {
    test('고정 지출·수입 알림 토글이 표시되고 저장 후 유지된다', async ({ authedContext }) => {
      const { page } = authedContext;

      const notifPage = new NotificationSettingsPage(page);
      await notifPage.goto();

      // 토글 노출
      await expect(notifPage.recurringTransactionSwitch).toBeVisible();

      // 기본 on → off로 변경 후 저장
      await notifPage.recurringTransactionSwitch.click();
      await page.getByRole('button', { name: '저장' }).click();
      await expect(page.getByText('알림 설정이 저장되었습니다')).toBeVisible({ timeout: 5000 });

      // 새로고침 후에도 off 유지
      await notifPage.goto();
      await expect(notifPage.recurringTransactionSwitch).not.toBeChecked();
    });
  });
});
