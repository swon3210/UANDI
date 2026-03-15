import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories, seedCashbookEntry } from '../helpers/emulator';
import { CashbookCategoriesPage } from '../page-objects/CashbookCategoriesPage';

test.describe('카테고리 설정', () => {
  test.describe('카테고리 목록', () => {
    test('탭별로 카테고리가 표시된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();

      // 기본 탭은 수입
      await expect(categoriesPage.tab('수입')).toHaveAttribute('data-state', 'active');
      await expect(categoriesPage.categoryItem('정기급여')).toBeVisible();
      await expect(categoriesPage.categoryItem('상여')).toBeVisible();

      // 지출 탭
      await categoriesPage.selectTab('지출');
      await expect(categoriesPage.categoryItem('월세')).toBeVisible();
      await expect(categoriesPage.categoryItem('식비')).toBeVisible();

      // 재테크 탭
      await categoriesPage.selectTab('재테크');
      await expect(categoriesPage.categoryItem('예적금')).toBeVisible();

      // Flex 탭
      await categoriesPage.selectTab('Flex');
      await expect(categoriesPage.categoryItem('여행')).toBeVisible();
    });

    test('서브그룹별로 카테고리가 그룹핑된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();

      // 수입 탭: 정기/비정기 섹션 헤더
      await expect(categoriesPage.sectionHeader('regular_income')).toBeVisible();
      await expect(categoriesPage.sectionHeader('irregular_income')).toBeVisible();

      // 지출 탭: 고정/변동 공통/변동 각자 섹션 헤더
      await categoriesPage.selectTab('지출');
      await expect(categoriesPage.sectionHeader('fixed_expense')).toBeVisible();
      await expect(categoriesPage.sectionHeader('variable_common')).toBeVisible();
      await expect(categoriesPage.sectionHeader('variable_personal')).toBeVisible();
    });
  });

  test.describe('카테고리 추가', () => {
    test('새 카테고리를 추가하면 목록에 표시된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();

      await categoriesPage.addCategory('보너스', 'gift');

      await expect(categoriesPage.categoryItem('보너스')).toBeVisible();
    });
  });

  test.describe('카테고리 편집', () => {
    test('카테고리를 편집하면 변경 사항이 반영된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();

      await categoriesPage.editCategory('상여', '성과급');

      await expect(categoriesPage.categoryItem('성과급')).toBeVisible();
      await expect(categoriesPage.categoryItem('상여')).not.toBeVisible();
    });
  });

  test.describe('카테고리 삭제', () => {
    test('카테고리를 삭제하면 목록에서 사라진다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();

      // 인센티브 삭제
      await categoriesPage.selectTab('수입');
      await categoriesPage.deleteCategory('인센티브');

      await expect(categoriesPage.categoryItem('인센티브')).not.toBeVisible();
    });

    test('사용 중인 카테고리 삭제 시 확인 다이얼로그가 표시된다', async ({
      authedContext,
    }) => {
      const { page, uid, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);
      // 정기급여 카테고리를 사용하는 항목 생성
      await seedCashbookEntry(coupleId, uid, {
        type: 'income',
        amount: 3000000,
        category: '정기급여',
      });

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();

      await categoriesPage.deleteCategory('정기급여');

      // 확인 다이얼로그가 표시됨
      await expect(page.getByText('사용 중인 항목이')).toBeVisible();

      // 확인 클릭 시 삭제됨
      await page.getByRole('button', { name: '삭제' }).click();
      await expect(categoriesPage.categoryItem('정기급여')).not.toBeVisible();
    });
  });
});
