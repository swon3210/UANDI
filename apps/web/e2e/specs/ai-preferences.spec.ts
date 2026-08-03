import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedDefaultCategories } from '../helpers/emulator';
import { AiSettingsPage } from '../page-objects/AiSettingsPage';

// 가계부 AI 프롬프트 맞춤화 — 3섹션(A 지출 분석 / B 현금흐름 예측 / C 거래 파싱).
// A·B는 enum/카테고리 선택만이라 자유 텍스트가 없다. C의 match/이체 키워드만 자유 입력이며
// 서버 sanitize+캡+enum 카테고리로 방어한다. 선택값은 couples/{id}/meta/aiPreferences 에
// 저장되어 커플 공유되고 새로고침 후에도 유지된다.

test.describe('AI 설정 — 가계부 프롬프트 맞춤화', () => {
  test('설정 화면에서 AI 설정으로 진입할 수 있다', async ({ authedContext }) => {
    const { page } = authedContext;
    await page.goto('/settings');

    await page.getByTestId('settings-ai').click();

    await expect(page).toHaveURL(/\/settings\/ai/);
    await expect(page.getByTestId('ai-settings-header')).toBeVisible();
  });

  test('세 섹션은 기본 꺼짐이고, 켜야 옵션이 보인다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const ai = new AiSettingsPage(page);
    await ai.goto();

    await expect(ai.analyzeEnabled).toHaveAttribute('aria-checked', 'false');
    await expect(ai.predictEnabled).toHaveAttribute('aria-checked', 'false');
    await expect(ai.parseEnabled).toHaveAttribute('aria-checked', 'false');
    await expect(ai.tone('strict')).toHaveCount(0);

    await ai.enableAnalyze();
    await expect(ai.tone('strict')).toBeVisible();
  });

  test('세 섹션 선택값을 저장하면 새로고침 후에도 유지된다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await seedDefaultCategories(coupleId);
    const ai = new AiSettingsPage(page);
    await ai.goto();

    // A. 지출 분석
    await ai.enableAnalyze();
    await ai.tone('strict').click();
    await ai.focus('saving').click();
    await ai.length('detailed').click();

    // B. 현금흐름 예측
    await ai.enablePredict();
    await ai.stance('aggressive').click();
    await ai.excludeChip('식비').click();

    // C. 거래 파싱
    await ai.enableParse();
    await ai.addRuleButton.click();
    await ai.ruleMatch(0).fill('스타벅스');
    await ai.selectRuleCategory(0, '교통');
    await ai.addTransferKeyword('홍길동');

    const res = await ai.save();
    expect(res.ok()).toBe(true);

    await page.reload();

    // A 유지
    await expect(ai.analyzeEnabled).toHaveAttribute('aria-checked', 'true');
    await expect(ai.tone('strict')).toHaveAttribute('data-state', 'checked');
    await expect(ai.focus('saving')).toHaveAttribute('data-state', 'checked');
    await expect(ai.length('detailed')).toHaveAttribute('data-state', 'checked');

    // B 유지
    await expect(ai.predictEnabled).toHaveAttribute('aria-checked', 'true');
    await expect(ai.stance('aggressive')).toHaveAttribute('data-state', 'checked');
    await expect(ai.excludeChip('식비')).toHaveAttribute('aria-pressed', 'true');

    // C 유지
    await expect(ai.parseEnabled).toHaveAttribute('aria-checked', 'true');
    await expect(ai.ruleMatch(0)).toHaveValue('스타벅스');
    await expect(ai.ruleCategoryTrigger(0)).toContainText('교통');
    await expect(ai.transferChip('홍길동')).toBeVisible();
  });
});
