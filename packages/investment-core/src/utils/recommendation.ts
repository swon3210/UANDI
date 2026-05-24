import type { ForexIndicators, ForexRecommendation, ForexTrend } from '../types';

const BUY_PERCENTILE_52W = 25;
const BUY_PERCENTILE_13W = 20;
const BUY_RSI_MAX = 40;
const SELL_PERCENTILE_52W = 75;
const SELL_RSI_MIN = 65;

export function computeRecommendation(indicators: ForexIndicators): ForexRecommendation {
  const { rsi14, percentile52w, percentile13w, trend } = indicators;
  if (rsi14 === null || percentile52w === null || percentile13w === null) return 'hold';

  const buyZone = percentile52w <= BUY_PERCENTILE_52W || percentile13w <= BUY_PERCENTILE_13W;
  if (buyZone && rsi14 <= BUY_RSI_MAX && trend !== 'up') return 'buy';

  const sellZone = percentile52w >= SELL_PERCENTILE_52W && rsi14 >= SELL_RSI_MIN;
  if (sellZone && trend === 'up') return 'hold';
  if (sellZone) return 'sell';

  return 'hold';
}

export const RECOMMENDATION_LABEL: Record<ForexRecommendation, string> = {
  buy: '매수 우호',
  sell: '매도 우호',
  hold: '중립',
};

export const TREND_LABEL: Record<ForexTrend, string> = {
  up: '상승 추세',
  down: '하락 추세',
  sideways: '횡보',
};
