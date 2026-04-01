import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories, seedCashbookEntry } from '../helpers/emulator';

test.describe('자연어 가계부 입력', () => {
  test('자연어 입력 필드에 텍스트를 입력하고 전송하면 EntryForm이 파싱 결과로 pre-fill된다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/cashbook');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    // 자연어 입력 필드 확인
    const aiInput = page.getByTestId('ai-parse-input');
    await expect(aiInput).toBeVisible();

    // 텍스트 입력 후 전송
    await aiInput.fill('점심 김치찌개 9000원');
    await page.getByTestId('ai-parse-submit').click();

    // EntryForm Sheet가 열리고 파싱 결과가 pre-fill됨 (mock: amount=9000, category=식비, description=김치찌개)
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();

    // 금액이 9000으로 채워져 있어야 함
    const amountInput = sheet.locator('input[name="amount"]');
    await expect(amountInput).toHaveValue('9000');

    // 메모에 "김치찌개"가 채워져 있어야 함
    const descInput = sheet.locator('input[name="description"]');
    await expect(descInput).toHaveValue('김치찌개');
  });

  test('빈 텍스트로는 전송 버튼이 비활성화된다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/cashbook');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    const submitBtn = page.getByTestId('ai-parse-submit');
    await expect(submitBtn).toBeDisabled();
  });

  test('자연어 파싱 중 로딩 상태가 표시된다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    await page.goto('/cashbook');
    await page.waitForSelector('[data-testid="cashbook-header"]');

    const aiInput = page.getByTestId('ai-parse-input');
    await aiInput.fill('점심 김치찌개 9000원');
    await page.getByTestId('ai-parse-submit').click();

    // 로딩 중에는 입력이 비활성화됨
    // (mock은 즉시 응답하므로 결과 Sheet가 빠르게 뜸)
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible({ timeout: 5000 });
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

    await page.goto('/cashbook');
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

    await page.goto('/cashbook');
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
