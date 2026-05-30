import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedAssetAllocation } from '../helpers/emulator';
import { AssetAllocationPage } from '../page-objects/AssetAllocationPage';

test.describe('재테크 자산 배분 비율 (예금/적금/투자)', () => {
  test('대시보드의 자산 배분 카드를 누르면 /outer/allocation 으로 이동한다', async ({
    authedPage,
  }) => {
    await authedPage.goto('/outer');
    const card = authedPage.getByTestId('outer-allocation-entry');
    await expect(card).toBeVisible({ timeout: 10000 });

    await card.click();
    await expect(authedPage).toHaveURL(/\/outer\/allocation$/, { timeout: 10000 });
    await expect(authedPage.getByTestId('asset-allocation-editor')).toBeVisible();
  });

  test('설정값이 없으면 기본 비율(40/30/30)로 합계 100%, 저장 버튼이 활성화된다', async ({
    authedPage,
  }) => {
    const allocation = new AssetAllocationPage(authedPage);
    await allocation.goto();

    await expect(allocation.value('deposit')).toHaveText('40%');
    await expect(allocation.value('savings')).toHaveText('30%');
    await expect(allocation.value('investment')).toHaveText('30%');
    await expect(allocation.total).toHaveText('100%');
    await expect(allocation.saveButton).toBeEnabled();
    await expect(allocation.totalWarning).toBeHidden();
  });

  test('저장된 비율이 있으면 그 값으로 렌더링된다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedAssetAllocation(coupleId, uid, { deposit: 20, savings: 50, investment: 30 });

    const allocation = new AssetAllocationPage(page);
    await allocation.goto();

    await expect(allocation.value('deposit')).toHaveText('20%');
    await expect(allocation.value('savings')).toHaveText('50%');
    await expect(allocation.value('investment')).toHaveText('30%');
    await expect(allocation.total).toHaveText('100%');
  });

  test('합계가 100%가 아니면 경고가 뜨고 저장 버튼이 비활성화된다', async ({ authedPage }) => {
    const allocation = new AssetAllocationPage(authedPage);
    await allocation.goto();

    // 예금 40 → 45 (합계 105)
    await allocation.nudge('deposit', 'up');
    await expect(allocation.value('deposit')).toHaveText('45%');
    await expect(allocation.total).toHaveText('105%');
    await expect(allocation.totalWarning).toBeVisible();
    await expect(allocation.saveButton).toBeDisabled();
  });

  test('비율을 조정해 합계 100%로 맞춘 뒤 저장하면 새로고침 후에도 유지된다', async ({
    authedPage,
  }) => {
    const allocation = new AssetAllocationPage(authedPage);
    await allocation.goto();

    // 예금 40 → 50, 투자 30 → 20 (합계 100 유지)
    await allocation.nudge('deposit', 'up', 2);
    await allocation.nudge('investment', 'down', 2);
    await expect(allocation.value('deposit')).toHaveText('50%');
    await expect(allocation.value('investment')).toHaveText('20%');
    await expect(allocation.total).toHaveText('100%');

    await allocation.save();
    await expect(authedPage.getByText('자산 배분 비율이 저장되었습니다.')).toBeVisible({
      timeout: 10000,
    });

    await authedPage.reload();
    await expect(allocation.value('deposit')).toHaveText('50%');
    await expect(allocation.value('savings')).toHaveText('30%');
    await expect(allocation.value('investment')).toHaveText('20%');
  });
});
