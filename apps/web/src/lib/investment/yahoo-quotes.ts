import type { StockQuote } from '@/utils/stock-portfolio';

// Yahoo Finance chart API (키 불필요). 장중엔 지연 시세, 장 마감 후엔 종가가 regularMarketPrice로 온다.
const CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const TEN_MINUTES = 10 * 60;

type ChartResult = {
  meta?: { regularMarketPrice?: number; regularMarketTime?: number; currency?: string };
  indicators?: { quote?: { close?: (number | null)[] }[] };
  events?: { dividends?: Record<string, { amount: number; date: number }> };
};

async function fetchChart(yahooSymbol: string): Promise<ChartResult | null> {
  const url = `${CHART_URL}/${encodeURIComponent(yahooSymbol)}?range=1y&interval=1d&events=div`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: TEN_MINUTES },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { chart?: { result?: ChartResult[] | null } };
  const result = data.chart?.result?.[0];
  return result?.meta?.regularMarketPrice !== undefined ? result : null;
}

function toQuote(result: ChartResult, currency: 'KRW' | 'USD'): StockQuote {
  const meta = result.meta!;
  const closes = (result.indicators?.quote?.[0]?.close ?? []).filter(
    (c): c is number => typeof c === 'number'
  );
  const dividends = Object.values(result.events?.dividends ?? {});
  const dividendTotal = dividends.reduce((sum, d) => sum + d.amount, 0);

  return {
    price: meta.regularMarketPrice!,
    prevClose: closes.length >= 2 ? closes[closes.length - 2] : null,
    currency,
    asOf: new Date((meta.regularMarketTime ?? Date.now() / 1000) * 1000).toISOString(),
    dividendPerShareTtm: dividends.length > 0 ? dividendTotal : null,
  };
}

/** "KR:005930" / "US:AAPL" 키 하나의 시세. KR은 .KS(코스피) → .KQ(코스닥) 순으로 시도한다. */
export async function fetchStockQuote(key: string): Promise<StockQuote | null> {
  const [market, symbol] = key.split(':');
  if (!symbol) return null;

  if (market === 'KR') {
    for (const suffix of ['.KS', '.KQ']) {
      const result = await fetchChart(`${symbol}${suffix}`);
      if (result) return toQuote(result, 'KRW');
    }
    return null;
  }

  const result = await fetchChart(symbol);
  return result ? toQuote(result, 'USD') : null;
}

export async function fetchUsdKrw(): Promise<number | null> {
  const result = await fetchChart('KRW=X');
  return result?.meta?.regularMarketPrice ?? null;
}
