import type { ForexIndicators, ForexRecommendation } from '../types';

export function computeRecommendation(indicators: ForexIndicators): ForexRecommendation {
  const { rsi14, percentile52w } = indicators;
  if (rsi14 === null || percentile52w === null) return 'hold';
  if (percentile52w <= 25 && rsi14 <= 35) return 'buy';
  if (percentile52w >= 75 && rsi14 >= 65) return 'sell';
  return 'hold';
}

export const RECOMMENDATION_LABEL: Record<ForexRecommendation, string> = {
  buy: '매수 우호',
  sell: '매도 우호',
  hold: '중립',
};
