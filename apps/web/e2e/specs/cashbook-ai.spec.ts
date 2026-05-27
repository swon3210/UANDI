import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories, seedCashbookEntry } from '../helpers/emulator';

test.describe('자연어 가계부 다건 입력', () => {
  test('1건 입력 → 미리보기 Sheet에 카드 1개 표시 → 모두 추가하면 월간 리스트에 반영된다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    const aiInput = page.getByTestId('ai-parse-input');
    await expect(aiInput).toBeVisible();

    // 1건 입력 (mock은 줄 수에 비례한 배열 반환)
    await aiInput.fill('점심 김치찌개 9000원');
    await page.getByTestId('ai-parse-submit').click();

    // 미리보기 Sheet가 열리고 카드 1개 표시
    const previewSheet = page.getByTestId('ai-bulk-preview-sheet');
    await expect(previewSheet).toBeVisible();
    const cards = page.getByTestId('parsed-entry-card');
    await expect(cards).toHaveCount(1);

    // 모두 추가
    await page.getByTestId('ai-bulk-confirm').click();

    // 월간 리스트에 반영
    await expect(page.getByText('김치찌개').first()).toBeVisible();
  });

  test('다건 입력 → 미리보기에 N개 카드 → 1개 토글 OFF 후 추가하면 N-1건이 반영된다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    // 3줄 입력 → mock은 3건 배열 반환
    const aiInput = page.getByTestId('ai-parse-input');
    await aiInput.fill('점심 김치찌개 9000원\n어제 택시 15000원\n월급 350만원');
    await page.getByTestId('ai-parse-submit').click();

    // 카드 3개 (토글 OFF해도 카드는 화면에 남음)
    const cards = page.getByTestId('parsed-entry-card');
    await expect(cards).toHaveCount(3);

    // 첫 카드 토글 OFF (추가에서 제외)
    await page.getByTestId('parsed-entry-toggle').first().click();
    await expect(cards).toHaveCount(3);
    await expect(page.getByTestId('ai-bulk-confirm')).toHaveText('2건 추가');

    // 추가
    await page.getByTestId('ai-bulk-confirm').click();

    // 미리보기 닫힘
    await expect(page.getByTestId('ai-bulk-preview-sheet')).not.toBeVisible();
  });

  test('카드 탭 → EntryForm 오버레이로 편집 후 저장 → 미리보기 카드에 수정값 반영', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    const aiInput = page.getByTestId('ai-parse-input');
    await aiInput.fill('점심 김치찌개 9000원');
    await page.getByTestId('ai-parse-submit').click();

    // 첫 카드 탭 → EntryForm 오픈
    await page.getByTestId('parsed-entry-card').first().click();
    const entryFormSheet = page.getByTestId('entry-form-sheet');
    await expect(entryFormSheet).toBeVisible();

    // 금액을 12000으로 수정 후 저장
    const amountInput = entryFormSheet.locator('input[name="amount"]');
    await amountInput.fill('12000');
    await entryFormSheet.getByRole('button', { name: /저장|추가/ }).click();

    // 미리보기 카드에 12,000원이 반영됨
    await expect(page.getByTestId('parsed-entry-card').first()).toContainText('12,000');
  });

  test('빈 텍스트로는 전송 버튼이 비활성화된다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    const submitBtn = page.getByTestId('ai-parse-submit');
    await expect(submitBtn).toBeDisabled();
  });

  test('영수증 이미지 2장 첨부 → 썸네일 노출 → 제출 → 미리보기에 카드 표시', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    // 영수증 이미지 2장 첨부 (buffer로 임시 이미지 생성)
    const fileInput = page.locator('input[type="file"][data-testid="ai-parse-file-input"]');
    await fileInput.setInputFiles([
      { name: 'receipt-1.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(1024) },
      { name: 'receipt-2.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(1024) },
    ]);

    // 썸네일 2개 노출
    await expect(page.getByTestId('ai-parse-thumbnail-0')).toBeVisible();
    await expect(page.getByTestId('ai-parse-thumbnail-1')).toBeVisible();

    // 텍스트 없이도 전송 버튼 활성화
    const submitBtn = page.getByTestId('ai-parse-submit');
    await expect(submitBtn).toBeEnabled();

    // 제출 → mock은 이미지 개수(2)만큼 entries 반환
    await submitBtn.click();

    // 미리보기 Sheet에 카드 2개
    const previewSheet = page.getByTestId('ai-bulk-preview-sheet');
    await expect(previewSheet).toBeVisible();
    await expect(page.getByTestId('parsed-entry-card')).toHaveCount(2);
  });

  test('기존 내역과 중복되는 mock 결과는 중복 배지 + 체크 해제 상태로 표시된다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedDefaultCategories(coupleId);
    // mock 응답과 동일한 시드 데이터: 오늘 식비 9000원 (김치찌개)
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 9000,
      category: '식비',
      description: '김치찌개',
      date: new Date().toISOString(),
    });

    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    await page.getByTestId('ai-parse-input').fill('점심 김치찌개 9000원');
    await page.getByTestId('ai-parse-submit').click();

    // 미리보기 시트에 중복 안내 배너 + 카드에 중복 배지 표시
    await expect(page.getByTestId('ai-bulk-preview-sheet')).toBeVisible();
    await expect(page.getByTestId('ai-bulk-duplicate-banner')).toBeVisible();
    await expect(page.getByTestId('parsed-entry-duplicate-badge')).toBeVisible();

    // 카드는 selected=false → 추가 버튼 "0건 추가" + 비활성화
    const card = page.getByTestId('parsed-entry-card').first();
    await expect(card).toHaveAttribute('data-duplicate', 'true');
    await expect(card).toHaveAttribute('data-selected', 'false');
    const confirmBtn = page.getByTestId('ai-bulk-confirm');
    await expect(confirmBtn).toHaveText('0건 추가');
    await expect(confirmBtn).toBeDisabled();

    // 사용자가 토글을 다시 켜면 "1건 추가"로 살아난다
    await page.getByTestId('parsed-entry-toggle').click();
    await expect(card).toHaveAttribute('data-selected', 'true');
    await expect(confirmBtn).toHaveText('1건 추가');
    await expect(confirmBtn).toBeEnabled();
  });

  test('중복이 아닌 항목은 그대로 체크된 채 유지되어 selectedCount만큼만 추가된다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await seedDefaultCategories(coupleId);
    // 3건 중 1건만 중복 (식비 9000원 - 첫 번째 mock 템플릿)
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 9000,
      category: '식비',
      description: '김치찌개',
      date: new Date().toISOString(),
    });

    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    // 3줄 입력 → mock이 3개 templates 반환
    await page
      .getByTestId('ai-parse-input')
      .fill('점심 김치찌개 9000원\n어제 택시 15000원\n월급 350만원');
    await page.getByTestId('ai-parse-submit').click();

    await expect(page.getByTestId('ai-bulk-duplicate-banner')).toBeVisible();

    // 3개 카드 중 1개만 중복 표시
    const duplicateCards = page.locator('[data-testid="parsed-entry-card"][data-duplicate="true"]');
    await expect(duplicateCards).toHaveCount(1);

    // 버튼은 "2건 추가" (중복 1건 제외)
    await expect(page.getByTestId('ai-bulk-confirm')).toHaveText('2건 추가');
  });

  test('첨부한 썸네일을 X 버튼으로 제거할 수 있다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    const fileInput = page.locator('input[type="file"][data-testid="ai-parse-file-input"]');
    await fileInput.setInputFiles([
      { name: 'receipt-1.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(1024) },
      { name: 'receipt-2.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(1024) },
    ]);

    await expect(page.getByTestId('ai-parse-thumbnail-0')).toBeVisible();
    await expect(page.getByTestId('ai-parse-thumbnail-1')).toBeVisible();

    // 첫 썸네일 제거
    await page.getByTestId('ai-parse-thumbnail-remove-0').click();

    // 남은 썸네일 1개 (index 0만 남음)
    await expect(page.getByTestId('ai-parse-thumbnail-0')).toBeVisible();
    await expect(page.getByTestId('ai-parse-thumbnail-1')).toHaveCount(0);
  });
});

test.describe('지출 패턴 AI 분석', () => {
  test('AI 분석 버튼을 클릭하면 분석 텍스트가 표시된다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedDefaultCategories(coupleId);
    // 분석에 필요한 데이터 시드
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 50000,
      category: '식비',
      description: '외식',
    });
    await seedCashbookEntry(coupleId, uid, {
      type: 'income',
      amount: 3000000,
      category: '정기급여',
      description: '월급',
    });

    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    // AI 분석 버튼 클릭
    const analyzeBtn = page.getByTestId('ai-analyze-btn');
    await expect(analyzeBtn).toBeVisible();
    await analyzeBtn.click();

    // 분석 결과 영역이 나타나고 mock 텍스트가 표시됨
    const analysisArea = page.getByTestId('ai-analysis-content');
    await expect(analysisArea).toBeVisible({ timeout: 5000 });
    await expect(analysisArea).toContainText('지출 분석');
  });

  test('다시 분석 버튼으로 재생성할 수 있다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await seedDefaultCategories(coupleId);
    await seedCashbookEntry(coupleId, uid, {
      type: 'expense',
      amount: 30000,
      category: '식비',
    });

    await page.goto('/inner/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    await page.getByTestId('ai-analyze-btn').click();
    await page.waitForSelector('[data-testid="ai-analysis-content"]');

    // 다시 분석 버튼
    const retryBtn = page.getByTestId('ai-analyze-retry');
    await expect(retryBtn).toBeVisible();
    await retryBtn.click();

    // 분석 결과가 다시 표시됨
    await expect(page.getByTestId('ai-analysis-content')).toBeVisible({ timeout: 5000 });
  });
});
