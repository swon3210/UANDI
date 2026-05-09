import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { AnnualPlanPage } from '../page-objects/AnnualPlanPage';
import { seedDefaultCategories } from '../helpers/emulator';

// 위저드/일괄수정/보고서 관련 신규 spec 은 별도 파일에서 다룬다.
// 본 파일은 메인(목표) 페이지의 hero + 카테고리 카드 표시만 검증한다.

test.describe('연간 경제 목표', () => {
  test.describe('목표 메인', () => {
    test('메인 진입 시 hero 카드와 3개 카테고리 카드(수입/지출/Flex)가 표시된다', async ({
      authedContext,
    }) => {
      const { page, coupleId } = authedContext;
      await seedDefaultCategories(coupleId);

      const annualPage = new AnnualPlanPage(page);
      await annualPage.goto();

      await expect(annualPage.heroCard).toBeVisible();
      await expect(annualPage.goalCard('income')).toBeVisible();
      await expect(annualPage.goalCard('expense')).toBeVisible();
      await expect(annualPage.goalCard('flex')).toBeVisible();
    });
  });
});
