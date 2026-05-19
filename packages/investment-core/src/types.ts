export type SupportedCurrency =
  | 'USD'
  | 'JPY'
  | 'EUR'
  | 'CNY'
  | 'GBP'
  | 'CHF'
  | 'AUD'
  | 'CAD'
  | 'NZD'
  | 'HKD'
  | 'SGD'
  | 'INR'
  | 'THB'
  | 'IDR'
  | 'MYR'
  | 'PHP';

export type CurrencyCategory = 'major' | 'asia' | 'europe' | 'emerging';

export type ForexRange = '1w' | '1m' | '3m' | '6m' | '1y' | '5y';

export type ExchangeRatePoint = {
  date: string;
  rate: number;
};

export type ForexRatesPayload = {
  currency: SupportedCurrency;
  points: ExchangeRatePoint[];
  latest: number;
  prevClose: number | null;
  asOf: string;
  fetchedAt: string;
};

export type ForexIndicators = {
  current: number;
  ma5: number | null;
  ma20: number | null;
  ma60: number | null;
  rsi14: number | null;
  percentile52w: number | null;
};

export type ForexRecommendation = 'buy' | 'sell' | 'hold';

export type ForexOutlook = {
  summary: string;
  confidence: number;
};
