import { expect, type Page } from '@playwright/test';
import { test } from '../fixtures/auth.fixture';

const MOCK_BASE_RATES: Record<string, number> = {
  USD: 1380,
  EUR: 1480,
  GBP: 1730,
  CHF: 1540,
  AUD: 910,
  CAD: 1010,
  NZD: 840,
  JPY: 9.1,
  CNY: 190,
  HKD: 176,
  SGD: 1020,
  INR: 16.5,
  THB: 38,
  IDR: 8.5,
  MYR: 290,
  PHP: 24,
};

async function mockForexRates(page: Page) {
  await page.route('**/api/forex/rates*', async (route) => {
    const url = new URL(route.request().url());
    const currency = url.searchParams.get('currency') ?? 'USD';
    const range = url.searchParams.get('range') ?? '1m';
    const length = range === '1w' ? 7 : range === '1y' ? 60 : 30;
    const base = MOCK_BASE_RATES[currency] ?? 1000;
    const amplitude = base * 0.02;
    const points = Array.from({ length }, (_, i) => {
      const day = String((i % 28) + 1).padStart(2, '0');
      const month = String(Math.floor(i / 28) + 1).padStart(2, '0');
      return {
        date: `2024-${month}-${day}`,
        rate: base + Math.sin(i / 3) * amplitude,
      };
    });
    const latest = points[points.length - 1].rate;
    const prevClose = points[points.length - 2].rate;
    const asOf = points[points.length - 1].date;
    const fetchedAt = new Date().toISOString();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ currency, points, latest, prevClose, asOf, fetchedAt }),
    });
  });
}

test.describe('환테크 (investment/forex)', () => {
  test('홈 대시보드의 환테크 카드 클릭 → /outer/forex 로 이동한다', async ({ authedPage }) => {
    await mockForexRates(authedPage);

    const entryCard = authedPage.getByTestId('investment-entry-card');
    await expect(entryCard).toBeVisible({ timeout: 10000 });

    await entryCard.click();
    await expect(authedPage).toHaveURL(/\/outer\/forex$/, { timeout: 10000 });
    await expect(authedPage.getByTestId('forex-list-header')).toBeVisible();
  });

  test('통화 목록 페이지에 메이저/아시아 카테고리 헤더와 16개 통화 카드가 표시된다', async ({
    authedPage,
  }) => {
    await mockForexRates(authedPage);
    await authedPage.goto('/outer/forex');

    await expect(authedPage.getByTestId('forex-category-major')).toBeVisible({ timeout: 10000 });
    await expect(authedPage.getByTestId('forex-category-asia')).toBeVisible();

    const majorCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD'];
    const asiaCurrencies = ['JPY', 'CNY', 'HKD', 'SGD', 'INR', 'THB', 'IDR', 'MYR', 'PHP'];

    for (const currency of [...majorCurrencies, ...asiaCurrencies]) {
      await expect(authedPage.getByTestId(`currency-card-${currency}`)).toBeVisible();
    }
  });

  test('USD 카드 클릭 → 상세 페이지에서 차트, 지표, AI 전망 모두 표시된다', async ({
    authedPage,
  }) => {
    await mockForexRates(authedPage);
    await authedPage.goto('/outer/forex');

    await authedPage.getByTestId('currency-card-USD').click();
    await expect(authedPage).toHaveURL(/\/outer\/forex\/USD$/);
    await expect(authedPage.getByTestId('forex-detail-header')).toBeVisible();

    await expect(authedPage.getByTestId('exchange-rate-chart')).toBeVisible({ timeout: 10000 });
    await expect(authedPage.getByTestId('indicator-panel')).toBeVisible();
    await expect(authedPage.getByTestId('forecast-card')).toBeVisible();

    // AI mock 응답이 ForecastCard에 표시된다 (recommendation 뱃지)
    await expect(
      authedPage.getByTestId('forecast-card').getByTestId(/recommendation-(buy|sell|hold)/)
    ).toBeVisible({ timeout: 10000 });
  });

  test('TimeRangeSelector 클릭 시 새로운 range로 환율을 다시 요청한다', async ({ authedPage }) => {
    await mockForexRates(authedPage);

    const ratesRequests: string[] = [];
    authedPage.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/forex/rates')) {
        const range = new URL(url).searchParams.get('range');
        if (range) ratesRequests.push(range);
      }
    });

    await authedPage.goto('/outer/forex/USD');
    await expect(authedPage.getByTestId('exchange-rate-chart')).toBeVisible({ timeout: 10000 });

    // 기본 1m으로 호출됨
    expect(ratesRequests).toContain('1m');

    // 1y 탭으로 변경
    await authedPage.getByTestId('time-range-1y').click();
    await expect.poll(() => ratesRequests).toContain('1y');
  });

  test('지원하지 않는 통화로 진입 시 404를 반환한다', async ({ authedPage }) => {
    await mockForexRates(authedPage);
    const response = await authedPage.goto('/outer/forex/XYZ');
    expect(response?.status()).toBe(404);
  });

  test('AI 전망의 [다시 분석] 버튼은 추천 뱃지가 노출된 상태에서 활성화된다', async ({
    authedPage,
  }) => {
    await mockForexRates(authedPage);
    await authedPage.goto('/outer/forex/USD');

    const forecastCard = authedPage.getByTestId('forecast-card');
    await expect(forecastCard.getByTestId(/recommendation-/)).toBeVisible({ timeout: 10000 });

    const refresh = authedPage.getByTestId('forecast-refresh');
    await expect(refresh).toBeEnabled();
  });
});
