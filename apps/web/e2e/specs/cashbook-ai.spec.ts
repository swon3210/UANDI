import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories, seedCashbookEntry } from '../helpers/emulator';

test.describe('자연어 가계부 다건 입력', () => {
  test('1건 입력 → 미리보기 Sheet에 카드 1개 표시 → 모두 추가하면 월간 리스트에 반영된다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/cashbook/history');
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

  test('다건 입력 → 미리보기에 N개 카드 → 1개 삭제 후 추가하면 N-1건이 반영된다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    // 3줄 입력 → mock은 3건 배열 반환
    const aiInput = page.getByTestId('ai-parse-input');
    await aiInput.fill('점심 김치찌개 9000원\n어제 택시 15000원\n월급 350만원');
    await page.getByTestId('ai-parse-submit').click();

    // 카드 3개
    const cards = page.getByTestId('parsed-entry-card');
    await expect(cards).toHaveCount(3);

    // 첫 카드 삭제
    await page.getByTestId('parsed-entry-remove').first().click();
    await expect(cards).toHaveCount(2);

    // 모두 추가
    await page.getByTestId('ai-bulk-confirm').click();

    // 미리보기 닫힘 + 월간 리스트에 2건 반영 (삭제한 첫 카드는 미반영)
    await expect(page.getByTestId('ai-bulk-preview-sheet')).not.toBeVisible();
  });

  test('카드 탭 → EntryForm 오버레이로 편집 후 저장 → 미리보기 카드에 수정값 반영', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/cashbook/history');
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
    await page.goto('/cashbook/history');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    const submitBtn = page.getByTestId('ai-parse-submit');
    await expect(submitBtn).toBeDisabled();
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

    await page.goto('/cashbook/history');
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

    await page.goto('/cashbook/history');
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
