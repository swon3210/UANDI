import type { StockHoldingInput } from '@/types';

// 보유 주식 평가 (docs/pages/outer/investment.md §1). 원화 환산은 현재 환율 기준 — 환차익은 반영하지 않는다.

export type StockQuote = {
  price: number;
  prevClose: number | null;
  currency: 'KRW' | 'USD';
  /** 시세 기준 시각 (ISO) */
  asOf: string;
  /** 최근 1년 주당 배당금 합계 (currency) */
  dividendPerShareTtm: number | null;
};

export type StockQuotesResponse = {
  quotes: Record<string, StockQuote>;
  usdKrw: number | null;
  fetchedAt: string;
};

export type StockValuation = {
  /** 매수금액 (원) */
  costKrw: number;
  /** 평가금액 (원). 시세가 없으면 null */
  valueKrw: number | null;
  /** 평가손익 (원) */
  profitKrw: number | null;
  profitRate: number | null;
  /** 오늘 변동 (원) */
  dayChangeKrw: number | null;
  /** 다음 배당 예상액 (원, 세전) — 사용자가 입력한 주당 배당금 기준 */
  nextDividendKrw: number | null;
  /** 연 예상 배당 (원, 세전) — 입력값이 없으면 TTM 기준 */
  annualDividendKrw: number | null;
  quote: StockQuote | null;
};

export function quoteKey(holding: Pick<StockHoldingInput, 'market' | 'symbol'>): string | null {
  const symbol = holding.symbol.trim().toUpperCase();
  return symbol ? `${holding.market}:${symbol}` : null;
}

export function valuateHolding(
  holding: StockHoldingInput,
  quotes: Record<string, StockQuote> | undefined,
  usdKrw: number | null
): StockValuation {
  const key = quoteKey(holding);
  const quote = (key && quotes?.[key]) || null;
  const fx = holding.currency === 'USD' ? usdKrw : 1;

  const costKrw = fx !== null ? holding.averagePrice * holding.quantity * fx : 0;
  const valueKrw = quote && fx !== null ? quote.price * holding.quantity * fx : null;
  const profitKrw = valueKrw !== null ? valueKrw - costKrw : null;
  const dayChangeKrw =
    quote && quote.prevClose !== null && fx !== null
      ? (quote.price - quote.prevClose) * holding.quantity * fx
      : null;

  const nextDividendKrw =
    holding.dividendPerShare !== null && fx !== null
      ? holding.dividendPerShare * holding.quantity * fx
      : null;
  const ttm = quote?.dividendPerShareTtm ?? null;
  const annualDividendKrw = ttm !== null && fx !== null ? ttm * holding.quantity * fx : null;

  return {
    costKrw,
    valueKrw,
    profitKrw,
    profitRate: profitKrw !== null && costKrw > 0 ? profitKrw / costKrw : null,
    dayChangeKrw,
    nextDividendKrw,
    annualDividendKrw,
    quote,
  };
}

export type PortfolioSummary = {
  totalCostKrw: number;
  /** 시세가 없는 종목은 매수금액으로 대체한 평가금액 합계 */
  totalValueKrw: number;
  totalProfitKrw: number;
  totalProfitRate: number | null;
  dayChangeKrw: number;
  annualDividendKrw: number;
  missingQuoteCount: number;
};

export function summarizePortfolio(valuations: StockValuation[]): PortfolioSummary {
  let totalCostKrw = 0;
  let totalValueKrw = 0;
  let dayChangeKrw = 0;
  let annualDividendKrw = 0;
  let missingQuoteCount = 0;

  for (const v of valuations) {
    totalCostKrw += v.costKrw;
    totalValueKrw += v.valueKrw ?? v.costKrw;
    dayChangeKrw += v.dayChangeKrw ?? 0;
    annualDividendKrw += v.annualDividendKrw ?? v.nextDividendKrw ?? 0;
    if (v.valueKrw === null) missingQuoteCount++;
  }

  const totalProfitKrw = totalValueKrw - totalCostKrw;
  return {
    totalCostKrw,
    totalValueKrw,
    totalProfitKrw,
    totalProfitRate: totalCostKrw > 0 ? totalProfitKrw / totalCostKrw : null,
    dayChangeKrw,
    annualDividendKrw,
    missingQuoteCount,
  };
}

/** "+1,234원" / "-1,234원" 형태 (0은 부호 없음) */
export function formatSignedWon(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '';
  return `${sign}${Math.abs(rounded).toLocaleString('ko-KR')}원`;
}

export function formatSignedPercent(rate: number): string {
  const pct = Math.round(rate * 1000) / 10;
  const sign = pct > 0 ? '+' : pct < 0 ? '-' : '';
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}
