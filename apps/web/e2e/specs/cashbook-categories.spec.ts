import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import {
  seedDefaultCategories,
  seedCashbookEntry,
  seedCashbookCategory,
} from '../helpers/emulator';
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

      await categoriesPage.addCategory('보너스', { icon: 'gift' });

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

    test('사용 중인 카테고리 삭제 시 확인 다이얼로그가 표시된다', async ({ authedContext }) => {
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

  test.describe('카테고리 계층 (부모-자식)', () => {
    test('부모 카테고리에 자식을 추가하면 부모 카드 아래에 자식 chip이 표시된다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      await categoriesPage.addChildCategory('식비', '외식', {
        examples: ['외식', '배달'],
      });

      // 자식 chip이 보임
      await expect(categoriesPage.childChip('외식')).toBeVisible();
      // 부모 카드 안에 있음 (자식 chip은 부모 카드 내부 testid 영역)
      await expect(
        categoriesPage.categoryItem('식비').getByTestId('category-child-외식')
      ).toBeVisible();
    });

    test('자식 카테고리 chip에는 subGroup 뱃지를 중복 표시하지 않는다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      const parentId = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '식비',
        icon: 'bowl_food',
      });
      await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '외식',
        icon: 'fork_knife',
        parentCategoryId: parentId,
      });

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      // 자식은 부모의 subGroup을 따르므로 chip에 "공통" 뱃지를 따로 표시하지 않는다
      await expect(categoriesPage.childChip('외식')).toBeVisible();
      await expect(categoriesPage.childChip('외식').getByText('공통')).toHaveCount(0);
    });

    test('부모 카테고리에 description을 입력하면 부모 카드에 표시된다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      // 식비 편집해서 description 추가
      await categoriesPage.openCategoryMenu('식비');
      await categoriesPage.menuItem('편집').click();
      await categoriesPage.descriptionInput.fill('장보기·외식·배달');
      await categoriesPage.saveButton.click();

      await expect(categoriesPage.categoryDescription('식비')).toContainText('장보기·외식·배달');
    });

    test('examples를 입력 후 다시 편집 시 그대로 복원된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      await categoriesPage.openCategoryMenu('식비');
      await categoriesPage.menuItem('편집').click();
      for (const ex of ['장보기', '외식', '배달']) {
        await categoriesPage.examplesInput.fill(ex);
        await categoriesPage.examplesInput.press('Enter');
      }
      await categoriesPage.saveButton.click();

      // 재오픈
      await categoriesPage.openCategoryMenu('식비');
      await categoriesPage.menuItem('편집').click();
      for (const ex of ['장보기', '외식', '배달']) {
        await expect(categoriesPage.sheet.getByText(ex, { exact: true })).toBeVisible();
      }
    });

    test('자식 카테고리를 편집하면 chip 라벨이 변경된다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      const parentId = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '식비',
        icon: 'bowl_food',
      });
      await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '외식',
        icon: 'fork_knife',
        parentCategoryId: parentId,
      });

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      await categoriesPage.editChildCategory('외식', '점심 외식');

      await expect(categoriesPage.childChip('점심 외식')).toBeVisible();
      await expect(categoriesPage.childChip('외식')).not.toBeVisible();
    });

    test('자식 카테고리를 단독 삭제하면 자식 chip만 사라진다', async ({ authedContext }) => {
      const { page, coupleId } = authedContext;
      const parentId = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '식비',
        icon: 'bowl_food',
      });
      await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '외식',
        icon: 'fork_knife',
        parentCategoryId: parentId,
      });

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      await categoriesPage.deleteChildCategory('외식');

      await expect(categoriesPage.childChip('외식')).not.toBeVisible();
      // 부모는 유지됨
      await expect(categoriesPage.categoryItem('식비')).toBeVisible();
    });

    test('자식이 있는 부모를 삭제하면 자식 개수 경고가 표시되고 확인 시 자식까지 함께 삭제된다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      const parentId = await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '식비',
        icon: 'bowl_food',
      });
      await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '외식',
        icon: 'fork_knife',
        parentCategoryId: parentId,
      });
      await seedCashbookCategory(coupleId, {
        group: 'expense',
        subGroup: 'variable_common',
        name: '장보기',
        icon: 'shopping_bag',
        parentCategoryId: parentId,
      });

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      await categoriesPage.deleteCategory('식비');

      await expect(page.getByText('하위 카테고리 2개')).toBeVisible();
      await page.getByRole('button', { name: '삭제' }).click();

      await expect(categoriesPage.categoryItem('식비')).not.toBeVisible();
      await expect(categoriesPage.childChip('외식')).not.toBeVisible();
      await expect(categoriesPage.childChip('장보기')).not.toBeVisible();
    });

    test('자식 추가 시트에는 부모 정보가 잠긴 상태로 subGroup 뱃지와 함께 표시된다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const categoriesPage = new CashbookCategoriesPage(page);
      await categoriesPage.goto();
      await categoriesPage.selectTab('지출');

      await categoriesPage.openCategoryMenu('식비');
      await categoriesPage.menuItem('하위 추가').click();

      await expect(categoriesPage.lockedParentLabel).toContainText('식비');
      await expect(categoriesPage.lockedParentLabel).toContainText('공통');
    });
  });
});
