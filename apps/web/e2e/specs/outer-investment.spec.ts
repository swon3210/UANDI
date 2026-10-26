import { expect, type Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';
import { seedOuterAsset } from '../helpers/emulator';
import { InvestmentPage } from '../page-objects/OuterAssetsPage';

const MOCK_QUOTES: Record<string, { price: number; prevClose: number; currency: string }> = {
  'KR:005930': { price: 72000, prevClose: 71000, currency: 'KRW' },
  'US:AAPL': { price: 200, prevClose: 198, currency: 'USD' },
};

async function mockQuotes(page: Page) {
  await page.route('**/api/investment/quotes*', async (route) => {
    const keys = (new URL(route.request().url()).searchParams.get('symbols') ?? '').split(',');
    const quotes = Object.fromEntries(
      keys
        .filter((k) => MOCK_QUOTES[k])
        .map((k) => [
          k,
          {
            ...MOCK_QUOTES[k],
            asOf: '2026-10-26T06:30:00.000Z',
            dividendPerShareTtm: null,
          },
        ])
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ quotes, usdKrw: 1400, fetchedAt: new Date().toISOString() }),
    });
  });
}

const MOCK_TRADES = [
  {
    aptName: '헬리오시티',
    dong: '가락동',
    area: 84.99,
    price: 1_850_000_000,
    date: '2026-10-12',
    floor: 12,
  },
  {
    aptName: '헬리오시티',
    dong: '가락동',
    area: 84.99,
    price: 1_800_000_000,
    date: '2026-09-20',
    floor: 5,
  },
  {
    aptName: '헬리오시티',
    dong: '가락동',
    area: 84.99,
    price: 1_900_000_000,
    date: '2026-08-02',
    floor: 20,
  },
  {
    aptName: '헬리오시티',
    dong: '가락동',
    area: 84.99,
    price: 1_500_000_000,
    date: '2026-05-02',
    floor: 3,
  },
  {
    aptName: '헬리오시티',
    dong: '가락동',
    area: 59.96,
    price: 1_450_000_000,
    date: '2026-10-01',
    floor: 8,
  },
];

async function mockAptTrades(page: Page, status = 200) {
  await page.route('**/api/investment/apt-trades*', async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(
        status === 200
          ? { trades: MOCK_TRADES, fetchedAt: new Date().toISOString() }
          : { error: '실거래가를 가져올 수 없어요' }
      ),
    });
  });
}

test.describe('재테크 투자 — 주식', () => {
  test('보유 종목이 없으면 빈 상태와 추가 버튼이 보인다', async ({ authedPage }) => {
    const investment = new InvestmentPage(authedPage);
    await investment.goto();

    await expect(authedPage.getByText('보유 주식을 등록해 보세요')).toBeVisible();
    await expect(authedPage.getByTestId('stock-import-button')).toBeVisible();
    await expect(authedPage.getByTestId('stock-add-button')).toBeVisible();
  });

  test('잔고 캡처로 추가하면 미리보기에서 확인 후 종목이 일괄 저장된다 (AI mock)', async ({
    authedPage,
  }) => {
    await mockQuotes(authedPage);
    const investment = new InvestmentPage(authedPage);
    await investment.goto();

    await investment.importStockScreenshot();
    const sheet = authedPage.getByTestId('stock-import-sheet');
    await expect(sheet).toBeVisible({ timeout: 10000 });
    await expect(sheet.getByTestId('stock-import-item')).toHaveCount(2);
    await sheet.getByTestId('stock-import-save').click();

    await expect(investment.stockCards).toHaveCount(2);
    await expect(investment.stockCards.filter({ hasText: '삼성전자' })).toBeVisible();
    await expect(investment.stockCards.filter({ hasText: '애플' })).toBeVisible();
  });

  test('시세 기준 평가손익(+/-)과 배당 예정액이 표시된다', async ({ authedContext }) => {
    const { page, coupleId, uid } = authedContext;
    await mockQuotes(page);
    await seedOuterAsset(coupleId, uid, 'stockHoldings', {
      name: '삼성전자',
      symbol: '005930',
      market: 'KR',
      currency: 'KRW',
      quantity: 10,
      averagePrice: 65000,
      dividendPerShare: 361,
      nextDividendDate: '2026-11-15',
    });
    await seedOuterAsset(coupleId, uid, 'stockHoldings', {
      name: '애플',
      symbol: 'AAPL',
      market: 'US',
      currency: 'USD',
      quantity: 2,
      averagePrice: 210,
      dividendPerShare: null,
      nextDividendDate: null,
    });

    const investment = new InvestmentPage(page);
    await investment.goto();

    const samsung = investment.stockCards.filter({ hasText: '삼성전자' });
    // (72,000 - 65,000) × 10 = +70,000원, 수익률 +10.8%
    await expect(samsung.getByTestId('stock-holding-profit')).toHaveText('+70,000원 (+10.8%)');
    await expect(samsung.getByTestId('stock-holding-dividend')).toContainText('3,610원');

    const apple = investment.stockCards.filter({ hasText: '애플' });
    // (200 - 210) × 2 × 1,400 = -28,000원
    await expect(apple.getByTestId('stock-holding-profit')).toHaveText('-28,000원 (-4.8%)');

    // 평가금액 720,000 + 560,000 = 1,280,000원, 손익 +42,000원
    await expect(page.getByTestId('portfolio-total-value')).toHaveText('1,280,000원');
    await expect(page.getByTestId('portfolio-total-profit')).toContainText('+42,000원');
  });

  test('종목을 직접 추가하고 삭제할 수 있다', async ({ authedPage }) => {
    await mockQuotes(authedPage);
    const investment = new InvestmentPage(authedPage);
    await investment.goto();

    await authedPage.getByTestId('stock-add-button').click();
    await investment.stockForm.getByLabel('종목명').fill('삼성전자');
    await investment.stockForm.getByLabel('종목코드').fill('005930');
    await investment.stockForm.getByLabel('보유 수량').fill('5');
    await investment.stockForm.getByLabel('평균 매수가 (원)').fill('80000');
    await investment.stockForm.getByTestId('stock-submit').click();

    await expect(investment.stockCards).toHaveCount(1);
    await expect(investment.stockCards.getByTestId('stock-holding-profit')).toHaveText(
      '-40,000원 (-10.0%)'
    );

    await investment.stockCards.first().click();
    await investment.stockForm.getByTestId('stock-delete').click();
    await expect(authedPage.getByText('보유 주식을 등록해 보세요')).toBeVisible();
  });
});

test.describe('재테크 투자 — 부동산', () => {
  test('지역·아파트로 실거래를 조회해 평형을 고르면 시세·손익·예상 세금이 표시된다', async ({
    authedPage,
  }) => {
    await mockAptTrades(authedPage);
    const investment = new InvestmentPage(authedPage);
    await investment.goto();
    await investment.openRealEstateTab();

    await authedPage.getByTestId('real-estate-add-button').click();
    const form = investment.realEstateForm;
    await investment.selectOption(form.getByTestId('real-estate-sigungu'), '송파구');
    await form.getByLabel('아파트명').fill('헬리오시티');
    await form.getByTestId('real-estate-search').click();

    const options = form.getByTestId('real-estate-area-option');
    await expect(options).toHaveCount(2);
    await options.filter({ hasText: '84.99㎡' }).click();
    await expect(form.getByLabel('전용면적 (㎡)')).toHaveValue('84.99');

    await form.getByLabel('매수가 (만원)').fill('150000');
    await form.getByLabel('매수일').fill('2020-01-15');
    await form.getByTestId('real-estate-submit').click();

    const card = investment.realEstateCards.first();
    await expect(card).toContainText('헬리오시티');
    // 84.99㎡ 최근 3건(18.5억·18억·19억) 중앙값 = 18.5억
    await expect(card.getByTestId('real-estate-market-price')).toHaveText('18억 5,000만원');
    await expect(card.getByTestId('real-estate-profit')).toHaveText('+350,000,000원 (+23.3%)');
    await expect(card.getByTestId('real-estate-property-tax')).toBeVisible();
    await expect(card.getByTestId('real-estate-capital-gains-tax')).toBeVisible();
  });

  test('시세가 12억을 넘는 1주택은 비과세가 아닌 고가주택 양도세로 계산된다', async ({
    authedContext,
  }) => {
    const { page, coupleId, uid } = authedContext;
    await mockAptTrades(page);
    await seedOuterAsset(coupleId, uid, 'realEstateHoldings', {
      aptName: '헬리오시티',
      lawdCd: '11710',
      regionName: '서울특별시 송파구',
      dong: '가락동',
      exclusiveArea: 59.96,
      purchasePrice: 1_000_000_000,
      purchaseDate: '2019-03-01',
      isSingleHome: true,
      manualMarketPrice: null,
    });

    const investment = new InvestmentPage(page);
    await investment.goto();
    await investment.openRealEstateTab();

    const card = investment.realEstateCards.first();
    await expect(card.getByTestId('real-estate-market-price')).toHaveText('14억 5,000만원');
    // 14.5억 > 12억 → 고가주택 과세
    await expect(card.getByTestId('real-estate-capital-gains-tax')).not.toContainText('비과세');
  });

  test('실거래 조회에 실패해도 전용면적을 직접 입력해 저장할 수 있다', async ({ authedPage }) => {
    await mockAptTrades(authedPage, 503);
    const investment = new InvestmentPage(authedPage);
    await investment.goto();
    await investment.openRealEstateTab();

    await authedPage.getByTestId('real-estate-add-button').click();
    const form = investment.realEstateForm;
    await investment.selectOption(form.getByTestId('real-estate-sigungu'), '강남구');
    await form.getByLabel('아파트명').fill('래미안대치팰리스');
    await form.getByTestId('real-estate-search').click();
    await expect(form.getByTestId('real-estate-search-error')).toBeVisible();

    await form.getByLabel('전용면적 (㎡)').fill('84.97');
    await form.getByLabel('매수가 (만원)').fill('200000');
    await form.getByTestId('real-estate-submit').click();

    const card = investment.realEstateCards.first();
    await expect(card).toContainText('래미안대치팰리스');
    await expect(card.getByTestId('real-estate-market-price')).toHaveText('시세 없음');
  });
});
