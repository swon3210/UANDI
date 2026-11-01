import { expect } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { OnboardingPage } from '../page-objects/OnboardingPage';
import { getUserCoupleId, listCategories, listEntries } from '../helpers/emulator';

/**
 * 지난 내역 가져오기 (/inner/cashbook/import) — docs/pages/inner/cashbook-import.md
 * AI 목(USE_AI_MOCK): 텍스트 한 줄당 entry 1건. allowNewCategories이고 줄에 '반려동물'이 있으면
 * 그 줄은 category '반려동물'로, 응답에 { name:'반려동물', group:'expense', subGroup:'variable_common', icon:'paw_print' } 제안.
 */
const IMPORT_TEXT = '점심 김치찌개 9000원\n반려동물 사료 30000원';

async function parseText(page: import('@playwright/test').Page, text: string) {
  await page.getByTestId('ai-parse-input').fill(text);
  await page.getByTestId('ai-parse-submit').click();
  await expect(page.getByTestId('import-step')).toHaveAttribute('data-step', '2', {
    timeout: 20000,
  });
}

test.describe('지난 내역 가져오기', () => {
  test('온보딩 시작하기로 들어오면 1단계가 보이고, 건너뛰기로 대시보드에 간다 (기본 카테고리는 생성돼 있다)', async ({
    noCoupleAuthedPage,
  }) => {
    const page = noCoupleAuthedPage;
    const onboarding = new OnboardingPage(page);
    await onboarding.createCoupleButton.click();
    await expect(onboarding.inviteCodeDisplay).toBeVisible();
    await onboarding.startAloneButton.click();

    await page.waitForURL(/\/inner\/cashbook\/import\?onboarding=1$/);
    await expect(page.getByTestId('import-step')).toHaveAttribute('data-step', '1');
    await expect(page.getByTestId('import-source-card')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('ai-parse-input')).toBeVisible();
    // 온보딩 진입에서는 FAB가 없다(풀스크린 플로우)
    await expect(page.getByTestId('cashbook-fab')).toHaveCount(0);

    await page.getByTestId('import-skip').click();
    await page.waitForURL(/\/inner\/cashbook$/);
    await expect(page.getByTestId('dashboard-header')).toBeVisible();

    // 커플 생성 시 기본 카테고리가 초기화돼 있다
    const uid = await page.evaluate(() => ((window as any).__auth as any).currentUser?.uid);
    const coupleId = await getUserCoupleId(uid);
    expect(coupleId).toBeTruthy();
    const categories = await listCategories(coupleId!);
    expect(categories.length).toBeGreaterThanOrEqual(20);
  });

  test('내역을 붙여넣어 분석하면 제안 카테고리를 확인·수정하고 내역까지 저장된다', async ({
    authedContext,
  }) => {
    const { page, coupleId } = authedContext;
    await page.goto('/inner/cashbook/import');
    await expect(page.getByTestId('import-step')).toHaveAttribute('data-step', '1');

    // 통장 내역 선택
    await page.getByTestId('import-source-account').click();
    await expect(page.getByTestId('import-source-account')).toHaveAttribute('aria-pressed', 'true');

    await parseText(page, IMPORT_TEXT);

    // 2단계: 제안 카테고리 카드(기본 체크) + 쓰인 기본 카테고리 칩
    const card = page.getByTestId('suggested-category');
    await expect(card).toHaveCount(1);
    await expect(card).toContainText('반려동물');
    await expect(card.getByRole('checkbox')).toBeChecked();
    await expect(page.getByTestId('used-default-category')).toContainText('식비');

    // 이름 수정 + 구분을 '각자'로
    await card.getByLabel('카테고리 이름').fill('강아지');
    await card.getByRole('button', { name: '각자' }).click();
    await page.getByTestId('import-next').click();

    // 3단계: 미리보기에 2건, 수정한 이름으로 표시
    await expect(page.getByTestId('import-step')).toHaveAttribute('data-step', '3');
    const cards = page.getByTestId('parsed-entry-card');
    await expect(cards).toHaveCount(2);
    await expect(page.getByTestId('ai-bulk-preview-sheet')).toContainText('강아지');

    await page.getByTestId('ai-bulk-confirm').click();
    await page.waitForURL(/\/inner\/cashbook$/);

    // 저장 검증: 기본 카테고리 + 새 카테고리(각자), 내역 2건 중 1건이 강아지
    const categories = await listCategories(coupleId);
    expect(categories.length).toBeGreaterThanOrEqual(20);
    const dog = categories.find((c) => c.name === '강아지');
    expect(dog?.subGroup).toBe('variable_personal');
    expect(dog?.icon).toBe('paw_print');

    const entries = await listEntries(coupleId);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.category).sort()).toEqual(['강아지', '식비']);
  });

  test('제안 카테고리를 빼면 그 내역은 기타로 저장된다', async ({ authedContext }) => {
    const { page, coupleId } = authedContext;
    await page.goto('/inner/cashbook/import');
    await parseText(page, IMPORT_TEXT);

    const card = page.getByTestId('suggested-category');
    await card.getByRole('checkbox').click();
    await expect(card.getByRole('checkbox')).not.toBeChecked();
    await page.getByTestId('import-next').click();
    await page.getByTestId('ai-bulk-confirm').click();
    await page.waitForURL(/\/inner\/cashbook$/);

    const categories = await listCategories(coupleId);
    expect(categories.find((c) => c.name === '반려동물')).toBeUndefined();
    const entries = await listEntries(coupleId);
    expect(entries.map((e) => e.category).sort()).toEqual(['기타', '식비']);
  });

  test('제안 카테고리 이름을 비우면 다음으로 갈 수 없다', async ({ authedContext }) => {
    const { page } = authedContext;
    await page.goto('/inner/cashbook/import');
    await parseText(page, IMPORT_TEXT);

    const card = page.getByTestId('suggested-category');
    await card.getByLabel('카테고리 이름').fill('');
    await page.getByTestId('import-next').click();
    await expect(page.getByTestId('import-step')).toHaveAttribute('data-step', '2');
    await expect(card).toContainText('이름을 입력해 주세요');
  });

  test('빈 대시보드의 "지난달 내역 불러오기"로 들어오고 뒤로가기로 돌아온다', async ({
    authedPage,
  }) => {
    await expect(authedPage.getByTestId('dashboard-empty')).toBeVisible();
    await authedPage.getByTestId('dashboard-import-link').click();
    await authedPage.waitForURL(/\/inner\/cashbook\/import$/);
    await expect(authedPage.getByTestId('import-skip')).toHaveCount(0);
    await authedPage.getByTestId('header-back').click();
    await authedPage.waitForURL(/\/inner\/cashbook$/);
  });
});
