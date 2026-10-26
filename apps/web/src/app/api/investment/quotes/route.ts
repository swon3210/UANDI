import { NextRequest, NextResponse } from 'next/server';
import { fetchStockQuote, fetchUsdKrw } from '@/lib/investment/yahoo-quotes';
import type { StockQuote, StockQuotesResponse } from '@/utils/stock-portfolio';

const TEN_MINUTES = 10 * 60;
const MAX_SYMBOLS = 50;
const KEY_PATTERN = /^(KR:[0-9A-Z]{6}|US:[A-Z.\-]{1,10})$/;

// GET /api/investment/quotes?symbols=KR:005930,US:AAPL
export async function GET(req: NextRequest) {
  const raw = new URL(req.url).searchParams.get('symbols') ?? '';
  const keys = [...new Set(raw.split(',').map((s) => s.trim().toUpperCase()))].filter((k) =>
    KEY_PATTERN.test(k)
  );

  if (keys.length === 0 || keys.length > MAX_SYMBOLS) {
    return NextResponse.json({ error: '잘못된 종목 목록입니다' }, { status: 400 });
  }

  try {
    const [usdKrw, ...results] = await Promise.all([
      keys.some((k) => k.startsWith('US:')) ? fetchUsdKrw() : Promise.resolve(null),
      ...keys.map((k) => fetchStockQuote(k).catch(() => null)),
    ]);

    const quotes: Record<string, StockQuote> = {};
    keys.forEach((k, i) => {
      const quote = results[i];
      if (quote) quotes[k] = quote;
    });

    if (Object.keys(quotes).length === 0) {
      return NextResponse.json({ error: '시세를 가져올 수 없습니다' }, { status: 503 });
    }

    const payload: StockQuotesResponse = { quotes, usdKrw, fetchedAt: new Date().toISOString() };
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': `public, s-maxage=${TEN_MINUTES}, stale-while-revalidate=${TEN_MINUTES}`,
      },
    });
  } catch (error) {
    console.error('[investment/quotes] 호출 실패:', error);
    return NextResponse.json({ error: '시세를 가져올 수 없습니다' }, { status: 503 });
  }
}
