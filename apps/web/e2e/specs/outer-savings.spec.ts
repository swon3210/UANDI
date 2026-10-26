import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedOuterAsset } from '../helpers/emulator';
import { SavingsPage } from '../page-objects/OuterAssetsPage';

function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 오늘 기준 n개월 전(후) 15일 — 말일 clamp 문제를 피하려고 15일로 고정 */
function monthOffset15(months: number): string {
  const now = new Date();
  return ymd(new Date(now.getFullYear(), now.getMonth() + months, 15));
}

test.describe('재테크 예적금 트래커', () => {
  test('상품이 없으면 빈 상태와 등록 버튼이 보인다', async ({ authedPage }) => {
    const savings = new SavingsPage(authedPage);
    await savings.goto();

    await expect(authedPage.getByText('예적금을 등록해 보세요')).toBeVisible();
    await expect(authedPage.getByTestId('savings-empty-add')).toBeVisible();
  });

  test('직접 입력으로 적금을 등록하면 카드와 합계가 표시된다', async ({ authedPage }) => {
    const savings = new SavingsPage(authedPage);
    await savings.goto();

    await savings.addButton.click();
    await expect(savings.formSheet).toBeVisible();
    await savings.field('상품명').fill('신혼 여행 적금');
    await savings.field('은행 (선택)').fill('카카오뱅크');
    await savings.field('적용 이율 (연 %)').fill('3.5');
    await savings.field('가입일').fill(monthOffset15(-2));
    await savings.field('만기일').fill(monthOffset15(10));
    await savings.field('회차당 입금액').fill('200000');
    await savings.submit();

    await expect(savings.cards).toHaveCount(1);
    await expect(savings.cards.first()).toContainText('신혼 여행 적금');
    await expect(savings.cards.first()).toContainText('카카오뱅크');
    await expect(savings.summary).toBeVisible();
  });

  test('저장된 적금은 자동이체 주기대로 오늘까지 납입 원금이 계산된다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    // 가입: 2개월 전 15일(1회차) → 이후 매월 1일 자동이체 → 오늘까지 3회 납입, 만기까지 12회
    await seedOuterAsset(coupleId, uid, 'savings', {
      name: '매월 1일 적금',
      bank: '우리은행',
      productType: 'installment',
      interestRate: 4.5,
      interestMethod: 'simple',
      startDate: monthOffset15(-2),
      maturityDate: monthOffset15(10),
      depositAmount: 100000,
      depositCycle: 'monthly',
      depositDay: 1,
      taxType: 'normal',
    });

    const savings = new SavingsPage(page);
    await savings.goto();

    const card = savings.cards.first();
    await expect(card.getByTestId('savings-account-progress')).toHaveText('3/12회');
    await expect(card.getByTestId('savings-account-principal')).toHaveText('300,000원');
    await expect(page.getByTestId('savings-summary-principal')).toHaveText('300,000원');
    // 만기 원금 1,200,000원 + 세후 이자 → 원금보다 크다
    const maturityText = await card.getByTestId('savings-account-maturity').innerText();
    expect(Number(maturityText.replace(/[^0-9]/g, ''))).toBeGreaterThan(1_200_000);
  });

  test('상품 설명 캡처로 자동 입력하면 폼이 채워지고 저장된다 (AI mock)', async ({
    authedPage,
  }) => {
    const savings = new SavingsPage(authedPage);
    await savings.goto();

    await savings.addButton.click();
    await savings.importScreenshot();

    await expect(savings.field('상품명')).toHaveValue('우리 첫거래 적금', { timeout: 10000 });
    await expect(savings.field('은행 (선택)')).toHaveValue('우리은행');
    await expect(savings.field('적용 이율 (연 %)')).toHaveValue('4.5');
    await expect(savings.field('회차당 입금액')).toHaveValue('300000');
    await savings.submit();

    await expect(savings.cards).toHaveCount(1);
    await expect(savings.cards.first()).toContainText('우리 첫거래 적금');
    await expect(savings.cards.first()).toContainText('매월 10일');
  });

  test('카드를 눌러 삭제하면 목록에서 사라진다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedOuterAsset(coupleId, uid, 'savings', {
      name: '정기예금',
      bank: '신한은행',
      productType: 'deposit',
      interestRate: 3.2,
      interestMethod: 'simple',
      startDate: monthOffset15(-1),
      maturityDate: monthOffset15(11),
      depositAmount: 10000000,
      depositCycle: 'monthly',
      depositDay: 15,
      taxType: 'normal',
    });

    const savings = new SavingsPage(page);
    await savings.goto();
    await expect(savings.cards.first()).toContainText('1회 예치');
    await expect(savings.cards.first().getByTestId('savings-account-principal')).toHaveText(
      '10,000,000원'
    );

    await savings.cards.first().click();
    await savings.formSheet.getByTestId('savings-delete').click();
    await expect(page.getByText('예적금을 등록해 보세요')).toBeVisible();
  });
});
