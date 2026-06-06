import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories, seedCashbookEntry, seedSettlement } from '../helpers/emulator';

/**
 * 월 결산 개선 플로우:
 *  - 수입/지출/FLEX 한눈에
 *  - 영수증·스크린샷 첨부로 내역 추가(내역 페이지와 동일한 중복 검사)
 *  - 첨부 이미지는 결산 완료 전까지 유지(새로고침에도)
 *  - 결산 완료 → 첨부 삭제 + 보고서 스냅샷 저장
 *  - 완료 보고서를 월별로 재조회, "다시 결산하기"로 수정
 *
 * AI 파싱은 USE_AI_MOCK 으로 동작:
 *  - 이미지 1장 → templates[0] = 식비 9,000원(오늘) 1건
 *  - findDuplicate는 금액+날짜만 비교
 */

// 디코딩 가능한 1x1 PNG (browser-image-compression이 빈 버퍼는 디코드 못 함)
const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

function curMonthKey(): { key: string; year: number; month: number } {
  const now = new Date();
  return {
    key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

function prevMonthKey(): { key: string; year: number; month: number } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    year: d.getFullYear(),
    month: d.getMonth() + 1,
  };
}

test.describe('월 결산 — 작업/완료/보관 플로우', () => {
  test('수입·지출·FLEX를 한눈에 보고, 파이에 FLEX 슬라이스가 표시된다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashbookEntry(coupleId, uid, {
      type: 'income',
      amount: 3_000_000,
      category: '정기급여',
      description: '월급',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 50_000,
      category: '식비',
      description: '외식',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'flex',
      amount: 80_000,
      category: '여행',
      description: '주말 나들이',
    });

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    // 3지표 요약
    await expect(page.getByTestId('settlement-summary-header')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('settlement-summary-income')).toBeVisible();
    await expect(page.getByTestId('settlement-summary-expense')).toBeVisible();
    await expect(page.getByTestId('settlement-summary-flex')).toBeVisible();

    // 파이에 FLEX 슬라이스(범례) 포함
    const pie = page.getByTestId('income-expense-pie');
    await expect(pie).toBeVisible();
    await expect(pie).toContainText('FLEX');
  });

  test('이미지 첨부로 내역 추가 시 내역 페이지와 동일한 중복 검사가 동작한다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedDefaultCategories(coupleId);
    // mock templates[0](식비 9,000 오늘)과 동일 내역 시드 → 중복으로 잡혀야 함
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 9000,
      category: '식비',
      description: '김치찌개',
      date: new Date().toISOString(),
    });

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    // 내역 추가는 별도 내역 페이지에서 수행
    await page.getByTestId('settlement-entries-link').click();
    await expect(page.getByTestId('settlement-entries-page')).toBeVisible();
    await page.getByTestId('settlement-add-btn').click();
    await expect(page.getByTestId('settlement-add-sheet')).toBeVisible();

    // 이미지 1장 첨부 → mock은 이미지 수(1)만큼 entries 반환
    const fileInput = page.locator('input[type="file"][data-testid="ai-parse-file-input"]');
    await fileInput.setInputFiles([{ name: 'receipt.png', mimeType: 'image/png', buffer: ONE_PX_PNG }]);
    await expect(page.getByTestId('ai-parse-thumbnail-0')).toBeVisible();
    await page.getByTestId('ai-parse-submit').click();

    // 중복 검사 결과: 같은 컴포넌트(AiBulkPreviewSheet)로 중복 배너 + 자동 제외
    await expect(page.getByTestId('ai-bulk-preview-sheet')).toBeVisible();
    await expect(page.getByTestId('ai-bulk-duplicate-banner')).toBeVisible();
    await expect(page.getByTestId('parsed-entry-duplicate-badge')).toBeVisible();
    // 모두 중복이라 선택 0건 → 추가 버튼 비활성
    await expect(page.getByTestId('ai-bulk-confirm')).toBeDisabled();
  });

  test('첨부한 이미지는 새로고침 후에도 유지된다(결산 완료 전까지)', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    await page.getByTestId('settlement-entries-link').click();
    await expect(page.getByTestId('settlement-entries-page')).toBeVisible();
    await page.getByTestId('settlement-add-btn').click();
    await expect(page.getByTestId('settlement-add-sheet')).toBeVisible();

    const fileInput = page.locator('input[type="file"][data-testid="ai-parse-file-input"]');
    await fileInput.setInputFiles([{ name: 'receipt.png', mimeType: 'image/png', buffer: ONE_PX_PNG }]);
    await expect(page.getByTestId('ai-parse-thumbnail-0')).toBeVisible();

    // 제출 시점에 첨부가 Storage+Firestore에 업로드된다
    await page.getByTestId('ai-parse-submit').click();
    await expect(page.getByTestId('ai-bulk-preview-sheet')).toBeVisible();
    // 미리보기를 닫아도(내역 미추가) 첨부는 유지된다
    await page.keyboard.press('Escape');

    // 페이지 갤러리에 썸네일 등장 (Storage 업로드 + Firestore 반영 대기)
    await expect(page.getByTestId('settlement-attachment-0')).toBeVisible({ timeout: 15000 });

    // 새로고침 후에도 유지
    await page.reload();
    await page.waitForSelector('[data-testid="cashbook-header"]');
    await expect(page.getByTestId('settlement-attachment-0')).toBeVisible({ timeout: 15000 });
  });

  test('결산 완료 시 보고서가 생성되고 첨부 갤러리가 사라진다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 50_000,
      category: '식비',
      description: '외식',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'flex',
      amount: 30_000,
      category: '여행',
      description: '카페',
    });

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    // 내역 페이지에서 첨부 1장 추가 → 워크스페이스로 돌아오면 갤러리에 노출
    await page.getByTestId('settlement-entries-link').click();
    await expect(page.getByTestId('settlement-entries-page')).toBeVisible();
    await page.getByTestId('settlement-add-btn').click();
    const fileInput = page.locator('input[type="file"][data-testid="ai-parse-file-input"]');
    await fileInput.setInputFiles([{ name: 'receipt.png', mimeType: 'image/png', buffer: ONE_PX_PNG }]);
    await expect(page.getByTestId('ai-parse-thumbnail-0')).toBeVisible();
    // 제출 시점에 업로드 → 미리보기 닫기
    await page.getByTestId('ai-parse-submit').click();
    await expect(page.getByTestId('ai-bulk-preview-sheet')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('settlement-attachment-0')).toBeVisible({ timeout: 15000 });

    // 워크스페이스로 복귀
    await page.getByTestId('settlement-entries-back').click();
    await expect(page.getByTestId('settlement-attachment-0')).toBeVisible({ timeout: 15000 });

    // 결산 완료
    await page.getByTestId('settlement-complete-btn').click();
    await expect(page.getByTestId('settlement-complete-dialog')).toBeVisible();
    await page.getByTestId('settlement-complete-confirm').click();

    // 보고서 뷰 전환 + 첨부 갤러리 제거
    await expect(page.getByTestId('settlement-report-view')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('결산 완료')).toBeVisible();
    await expect(page.getByTestId('settlement-attachment-gallery')).toHaveCount(0);
  });

  test('완료된 보고서를 월별로 다시 조회한다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    const prev = prevMonthKey();
    await seedSettlement(coupleId, {
      monthKey: prev.key,
      year: prev.year,
      month: prev.month,
      status: 'completed',
      totals: { income: 3_000_000, expense: 1_200_000, flex: 200_000 },
      aiAnalysis: '## 지난 달 결산\n\n전반적으로 예산 내에서 잘 관리됐어요.',
    });

    await page.goto(`/inner/cashbook/settlement?month=${prev.key}`);
    await page.waitForSelector('[data-testid="cashbook-header"]');

    await expect(page.getByTestId('settlement-report-view')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('settlement-report-ai')).toContainText('지난 달 결산');
    await expect(page.getByTestId('income-expense-pie')).toContainText('FLEX');
  });

  test('워크스페이스에서 내역 보기로 이동하면 그 달 내역 리스트가 보이고 첨부·추가할 수 있다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 12_000,
      category: '식비',
      description: '점심 외식',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'income',
      amount: 3_000_000,
      category: '정기급여',
      description: '월급',
    });

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    await page.getByTestId('settlement-entries-link').click();

    // 내역 페이지로 이동 + 리스트 노출
    await expect(page).toHaveURL(/\/inner\/cashbook\/settlement\/entries/);
    await expect(page.getByTestId('settlement-entries-page')).toBeVisible();
    await expect(page.getByTestId('settlement-summary-header')).toBeVisible();
    await expect(page.locator('[data-testid^="entry-card-"]')).toHaveCount(2);
    await expect(page.getByText('점심 외식')).toBeVisible();

    // 내역 페이지에서도 영수증 첨부로 추가 가능 (제출 시 업로드)
    await page.getByTestId('settlement-add-btn').click();
    await expect(page.getByTestId('settlement-add-sheet')).toBeVisible();
    const fileInput = page.locator('input[type="file"][data-testid="ai-parse-file-input"]');
    await fileInput.setInputFiles([{ name: 'receipt.png', mimeType: 'image/png', buffer: ONE_PX_PNG }]);
    await expect(page.getByTestId('ai-parse-thumbnail-0')).toBeVisible();
    await page.getByTestId('ai-parse-submit').click();
    await expect(page.getByTestId('ai-bulk-preview-sheet')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('settlement-attachment-0')).toBeVisible({ timeout: 15000 });
  });

  test('다시 결산하기를 누르면 작업 화면으로 돌아간다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    const cur = curMonthKey();
    await seedSettlement(coupleId, {
      monthKey: cur.key,
      year: cur.year,
      month: cur.month,
      status: 'completed',
      totals: { income: 2_000_000, expense: 800_000, flex: 100_000 },
    });

    await page.goto('/inner/cashbook/settlement');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    await expect(page.getByTestId('settlement-report-view')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('settlement-redo-btn').click();

    // draft 워크스페이스로 복귀 (결산 완료 버튼 노출, 보고서 뷰 사라짐)
    await expect(page.getByTestId('settlement-complete-btn')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('settlement-report-view')).toHaveCount(0);
  });
});
