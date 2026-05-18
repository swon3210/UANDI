// Types
export type {
  SupportedCurrency,
  ForexRange,
  ExchangeRatePoint,
  ForexRatesPayload,
  ForexIndicators,
  ForexRecommendation,
  ForexOutlook,
} from './types';

// Constants
export {
  SUPPORTED_CURRENCIES,
  FOREX_RANGES,
  CURRENCY_META,
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
  computeIndicators,
} from './utils/indicators';
export { computeRecommendation, RECOMMENDATION_LABEL } from './utils/recommendation';

// Services
export { buildFrankfurterRangeUrl, parseFrankfurterRange } from './services/frankfurter';
