import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories, seedCashbookEntry } from '../helpers/emulator';

/**
 * 첨부 전용 + 일괄 분석·동기화 플로우 (USE_AI_MOCK):
 *  - "이미지 추가"는 업로드만 하고 파싱하지 않는다 (AI 미리보기 시트가 뜨지 않음)
 *  - "전체 분석 & 동기화" 한 번으로 모든 첨부를 분석한다
 *  - 거래는 거래일(date) 기준 월별로 분류 (account mock = 이번 달 일반 1 + 송금 1 + 전월 일반 1)
 *  - 단순 송금은 "확인 필요 · 송금" 그룹으로 분리, 기본 OFF
 *  - 다른 달 항목은 "이 달이 아니에요" 배지 + 기본 OFF
 *  - 금액+날짜가 같은 기존 내역은 중복으로 자동 제외
 *
 * account mock 결과(이미지 1장당):
 *  - 이번 달: 식비 12,000 (일반)  ← 기본 ON
 *  - 이번 달: 기타 50,000 (송금)  ← 기본 OFF
 *  - 전월:    식비 30,000 (일반)  ← 다른 달, 기본 OFF
 */

const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

function curMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function prevMonthKey(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function attachAccountImage(page: import('@playwright/test').Page) {
  const fileInput = page.locator(
    'input[type="file"][data-testid="settlement-attachment-file-input-account"]'
  );
  await fileInput.setInputFiles([
    { name: 'account.png', mimeType: 'image/png', buffer: ONE_PX_PNG },
  ]);
  await expect(page.getByTestId('settlement-attachment-0')).toBeVisible({ timeout: 15000 });
}

test.describe('월 결산 — 첨부 전용 + 일괄 분석·동기화', () => {
  test('이미지 추가는 업로드만 하고 파싱하지 않는다(AI 시트 미노출)', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');
    await page.getByTestId('settlement-entries-link').click();
    await expect(page.getByTestId('settlement-entries-page')).toBeVisible();

    await attachAccountImage(page);

    // 첨부 즉시 파싱/미리보기가 일어나지 않는다
    await expect(page.getByTestId('bulk-sync-result')).toHaveCount(0);
    await expect(page.getByTestId('ai-bulk-preview-sheet')).toHaveCount(0);
  });

  test('전체 분석 시 월별 그룹·송금 그룹이 분리되고, 선택월만 기본 추가 대상이다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');
    await page.getByTestId('settlement-entries-link').click();
    await expect(page.getByTestId('settlement-entries-page')).toBeVisible();

    await attachAccountImage(page);

    // 전체 분석 & 동기화
    await page.getByTestId('settlement-analyze-all').click();
    await expect(page.getByTestId('bulk-sync-result')).toBeVisible({ timeout: 15000 });

    // 이번 달 그룹 + 전월(다른 달) 그룹
    await expect(page.getByTestId(`bulk-sync-month-${curMonthKey()}`)).toBeVisible();
    await expect(page.getByTestId(`bulk-sync-month-${prevMonthKey()}`)).toBeVisible();
    await expect(page.getByTestId(`bulk-sync-other-month-${prevMonthKey()}`)).toBeVisible();

    // 송금 확인 그룹 노출
    await expect(page.getByTestId('bulk-sync-transfer-section')).toBeVisible();

    // 선택월 일반 1건만 기본 ON → "1건 추가"
    await expect(page.getByTestId('bulk-sync-confirm')).toContainText('1건 추가');
    await page.getByTestId('bulk-sync-confirm').click();

    // 추가된 식비 12,000이 내역 리스트에 반영
    await expect(page.getByTestId('settlement-entries-page')).toBeVisible();
    await expect(page.locator('[data-testid^="entry-card-"]')).toHaveCount(1, { timeout: 15000 });
  });

  test('송금 토글을 켜면 추가 대상에 포함된다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');
    await page.getByTestId('settlement-entries-link').click();
    await attachAccountImage(page);

    await page.getByTestId('settlement-analyze-all').click();
    await expect(page.getByTestId('bulk-sync-result')).toBeVisible({ timeout: 15000 });

    // 송금 그룹의 토글을 켠다 → 추가 건수 1 → 2
    const transferToggle = page
      .getByTestId('bulk-sync-transfer-section')
      .getByTestId('parsed-entry-toggle')
      .first();
    await transferToggle.click();
    await expect(page.getByTestId('bulk-sync-confirm')).toContainText('2건 추가');
  });

  test('금액+날짜가 같은 기존 내역은 중복으로 자동 제외된다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedDefaultCategories(coupleId);
    // 이번 달 일반(식비 12,000 오늘)과 동일 내역 시드 → 중복으로 잡혀 기본 제외
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 12000,
      category: '식비',
      description: '스타벅스',
      date: new Date().toISOString(),
    });

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');
    await page.getByTestId('settlement-entries-link').click();
    await attachAccountImage(page);

    await page.getByTestId('settlement-analyze-all').click();
    await expect(page.getByTestId('bulk-sync-result')).toBeVisible({ timeout: 15000 });

    // 중복 배지 노출 + 선택월 일반이 중복이라 기본 선택 0 → 추가 버튼 비활성
    await expect(page.getByTestId('parsed-entry-duplicate-badge').first()).toBeVisible();
    await expect(page.getByTestId('bulk-sync-confirm')).toBeDisabled();
  });
});
