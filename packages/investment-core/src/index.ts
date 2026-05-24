// Types
export type {
  SupportedCurrency,
  CurrencyCategory,
  ForexRange,
  ExchangeRatePoint,
  ForexRatesPayload,
  ForexIndicators,
  ForexRecommendation,
  ForexOutlook,
  ForexTrend,
} from './types';

// Constants
export {
  SUPPORTED_CURRENCIES,
  FOREX_RANGES,
  CURRENCY_META,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  CURRENCY_CATEGORY,
  getCurrenciesByCategory,
  RANGE_DAYS,
  isSupportedCurrency,
  isForexRange,
  getDisplayRate,
} from './constants/currencies';

// Utils
export {
  computeMovingAverage,
  computeRsi,
  computePercentile,
  computeMaSlope,
  computeTrend,
  computeIndicators,
} from './utils/indicators';
export {
  computeRecommendation,
  RECOMMENDATION_LABEL,
  TREND_LABEL,
} from './utils/recommendation';

// Services
export { buildFrankfurterRangeUrl, parseFrankfurterRange } from './services/frankfurter';
