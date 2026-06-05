import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories, seedCashbookEntry } from '../helpers/emulator';

/**
 * 월 결산 페이지: 영수증/스크린샷으로 기존 내역의 누락·기록됨을 대조하는 점검 플로우.
 * AI 파싱은 USE_AI_MOCK 으로 동작하며, mock은 입력 줄 수만큼 templates를 반환한다.
 *   - templates[0]: 식비 9,000원 (오늘)
 *   - templates[1]: 교통 15,000원 (어제)
 * findDuplicate는 금액+날짜만 비교하므로, 동일 금액·날짜를 시드하면 "이미 기록됨"으로 잡힌다.
 */
const yesterdayIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString();
};

// 디코딩 가능한 1x1 PNG. browser-image-compression이 빈 버퍼는 디코드하지 못해
// 썸네일이 생성되지 않으므로 실제 이미지 바이트를 사용한다.
const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

test.describe('월 결산 — 영수증 내역 점검', () => {
  test('누락 항목은 추가 제안, 이미 있는 항목은 기록됨으로 분류된다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedDefaultCategories(coupleId);
    // mock templates[0]과 동일한 내역만 시드 → 1건은 기록됨, 1건(택시)은 누락
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 9000,
      category: '식비',
      description: '김치찌개',
      date: new Date().toISOString(),
    });

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    // 점검 진입
    await page.getByTestId('settlement-reconcile-btn').click();
    const sheet = page.getByTestId('receipt-reconcile-sheet');
    await expect(sheet).toBeVisible();

    // 2줄 입력 → mock이 templates[0](오늘 9000), templates[1](어제 15000) 반환
    await page.getByTestId('ai-parse-input').fill('점심 김치찌개 9000원\n어제 택시 15000원');
    await page.getByTestId('ai-parse-submit').click();

    // 대조 결과: 요약 + 누락 1건(택시) + 기록됨 1건(김치찌개)
    await expect(page.getByTestId('reconcile-result')).toBeVisible();
    await expect(page.getByTestId('reconcile-summary')).toBeVisible();
    await expect(page.getByTestId('parsed-entry-card')).toHaveCount(1);
    await expect(page.getByTestId('reconcile-matched-card')).toHaveCount(1);

    // 누락 1건 추가
    const confirmBtn = page.getByTestId('reconcile-confirm');
    await expect(confirmBtn).toHaveText('1건 추가');
    await confirmBtn.click();

    // 시트 닫힘 + 추가 완료 토스트
    await expect(page.getByTestId('reconcile-result')).not.toBeVisible();
    await expect(page.getByText('1건 추가됐어요')).toBeVisible();
  });

  test('영수증의 모든 항목이 이미 기록돼 있으면 추가 버튼 없이 안내만 보여준다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedDefaultCategories(coupleId);
    // mock templates[0](오늘 9000) + templates[1](어제 15000) 모두 시드
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 9000,
      category: '식비',
      description: '김치찌개',
      date: new Date().toISOString(),
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 15000,
      category: '교통',
      description: '택시',
      date: yesterdayIso(),
    });

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    await page.getByTestId('settlement-reconcile-btn').click();
    await page.getByTestId('ai-parse-input').fill('점심 김치찌개 9000원\n어제 택시 15000원');
    await page.getByTestId('ai-parse-submit').click();

    await expect(page.getByTestId('reconcile-result')).toBeVisible();
    await expect(page.getByTestId('reconcile-summary')).toContainText('모두 가계부에 기록');
    await expect(page.getByTestId('parsed-entry-card')).toHaveCount(0);
    await expect(page.getByTestId('reconcile-matched-card')).toHaveCount(2);

    // 추가 버튼은 없고 닫기만 노출
    await expect(page.getByTestId('reconcile-confirm')).toHaveCount(0);
    await expect(page.getByTestId('reconcile-close')).toBeVisible();
  });

  test('영수증 이미지 첨부로도 점검할 수 있다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    await page.getByTestId('settlement-reconcile-btn').click();

    await expect(page.getByTestId('receipt-reconcile-sheet')).toBeVisible();

    // 이미지 1장 첨부 → mock은 이미지 수(1)만큼 entries 반환
    const fileInput = page.locator('input[type="file"][data-testid="ai-parse-file-input"]');
    await fileInput.setInputFiles([
      { name: 'receipt.png', mimeType: 'image/png', buffer: ONE_PX_PNG },
    ]);
    await expect(page.getByTestId('ai-parse-thumbnail-0')).toBeVisible();
    await page.getByTestId('ai-parse-submit').click();

    // 가계부가 비어 있으므로 1건 모두 누락으로 분류
    await expect(page.getByTestId('reconcile-result')).toBeVisible();
    await expect(page.getByTestId('parsed-entry-card')).toHaveCount(1);
    await expect(page.getByTestId('reconcile-confirm')).toHaveText('1건 추가');
  });
});
