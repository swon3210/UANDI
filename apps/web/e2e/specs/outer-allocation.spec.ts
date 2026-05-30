import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedAssetAllocation } from '../helpers/emulator';
import { AssetAllocationPage } from '../page-objects/AssetAllocationPage';

test.describe('재테크 자산 배분 비율 (현금/예적금/투자)', () => {
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

  test('설정값이 없으면 기본 비율(10/50/40)로 합계 100%, 저장 버튼이 활성화된다', async ({
    authedPage,
  }) => {
    const allocation = new AssetAllocationPage(authedPage);
    await allocation.goto();

    await expect(allocation.value('cash')).toHaveText('10%');
    await expect(allocation.value('savings')).toHaveText('50%');
    await expect(allocation.value('investment')).toHaveText('40%');
    await expect(allocation.total).toHaveText('100%');
    await expect(allocation.saveButton).toBeEnabled();
    await expect(allocation.totalWarning).toBeHidden();
  });

  test('저장된 비율이 있으면 그 값으로 렌더링된다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedAssetAllocation(coupleId, uid, { cash: 20, savings: 50, investment: 30 });

    const allocation = new AssetAllocationPage(page);
    await allocation.goto();

    await expect(allocation.value('cash')).toHaveText('20%');
    await expect(allocation.value('savings')).toHaveText('50%');
    await expect(allocation.value('investment')).toHaveText('30%');
    await expect(allocation.total).toHaveText('100%');
  });

  test('합계가 100%가 아니면 경고가 뜨고 저장 버튼이 비활성화된다', async ({ authedPage }) => {
    const allocation = new AssetAllocationPage(authedPage);
    await allocation.goto();

    // 현금 10 → 15 (합계 105)
    await allocation.nudge('cash', 'up');
    await expect(allocation.value('cash')).toHaveText('15%');
    await expect(allocation.total).toHaveText('105%');
    await expect(allocation.totalWarning).toBeVisible();
    await expect(allocation.saveButton).toBeDisabled();
  });

  test('비율을 조정해 합계 100%로 맞춘 뒤 저장하면 새로고침 후에도 유지된다', async ({
    authedPage,
  }) => {
    const allocation = new AssetAllocationPage(authedPage);
    await allocation.goto();

    // 현금 10 → 20, 투자 40 → 30 (합계 100 유지)
    await allocation.nudge('cash', 'up', 2);
    await allocation.nudge('investment', 'down', 2);
    await expect(allocation.value('cash')).toHaveText('20%');
    await expect(allocation.value('investment')).toHaveText('30%');
    await expect(allocation.total).toHaveText('100%');

    await allocation.save();
    await expect(authedPage.getByText('자산 배분 비율이 저장되었습니다.')).toBeVisible({
      timeout: 10000,
    });

    await authedPage.reload();
    await expect(allocation.value('cash')).toHaveText('20%');
    await expect(allocation.value('savings')).toHaveText('50%');
    await expect(allocation.value('investment')).toHaveText('30%');
  });
});

test.describe('미래 자산 추이 그래프', () => {
  const onlyDigits = (s: string | null) => Number((s ?? '').replace(/[^0-9]/g, ''));

  test('자산 배분 페이지 하단에 미래 자산 추이 패널과 그래프가 표시된다', async ({
    authedPage,
  }) => {
    await authedPage.goto('/outer/allocation');
    await expect(authedPage.getByTestId('asset-projection-panel')).toBeVisible({ timeout: 10000 });
    await expect(authedPage.getByTestId('projection-chart')).toBeVisible();

    // 기본 입력(월 100만, 10년)으로 0보다 큰 예상 자산이 계산된다
    const result = authedPage.getByTestId('projection-result');
    await expect(result).toBeVisible();
    expect(onlyDigits(await result.textContent())).toBeGreaterThan(0);
  });

  test('월 납입액을 늘리면 예상 자산이 증가한다', async ({ authedPage }) => {
    await authedPage.goto('/outer/allocation');
    const result = authedPage.getByTestId('projection-result');
    await expect(result).toBeVisible({ timeout: 10000 });

    const before = onlyDigits(await result.textContent());

    const monthly = authedPage.getByTestId('projection-input-monthly');
    await monthly.fill('3000000');

    await expect.poll(async () => onlyDigits(await result.textContent())).toBeGreaterThan(before);
  });
});
