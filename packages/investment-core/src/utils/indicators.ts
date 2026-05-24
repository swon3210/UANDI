import type { ExchangeRatePoint, ForexIndicators, ForexTrend } from '../types';

const TREND_MA_POSITION_BAND = 0.002;
const TREND_SLOPE_BAND = 0.003;
const TREND_SLOPE_LOOKBACK = 5;
const TREND_MA_WINDOW = 20;
const TREND_REFERENCE_WINDOW = 60;

export function computeMovingAverage(points: ExchangeRatePoint[], window: number): number | null {
  if (points.length < window) return null;
  const slice = points.slice(-window);
  const sum = slice.reduce((acc, p) => acc + p.rate, 0);
  return sum / window;
}

export function computeRsi(points: ExchangeRatePoint[], period = 14): number | null {
  if (points.length < period + 1) return null;
  const slice = points.slice(-(period + 1));
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < slice.length; i += 1) {
    const diff = slice[i].rate - slice[i - 1].rate;
    if (diff > 0) gain += diff;
    else loss -= diff;
  }
  const avgGain = gain / period;
  const avgLoss = loss / period;
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function computePercentile(points: ExchangeRatePoint[], window: number): number | null {
  if (points.length === 0) return null;
  const slice = points.slice(-window);
  if (slice.length === 0) return null;
  const current = slice[slice.length - 1].rate;
  const sorted = [...slice].map((p) => p.rate).sort((a, b) => a - b);
  const below = sorted.filter((r) => r < current).length;
  return (below / sorted.length) * 100;
}

export function computeMaSlope(
  points: ExchangeRatePoint[],
  window: number = TREND_MA_WINDOW,
  lookback: number = TREND_SLOPE_LOOKBACK
): number | null {
  if (points.length < window + lookback) return null;
  const maNow = computeMovingAverage(points, window);
  const maPast = computeMovingAverage(points.slice(0, points.length - lookback), window);
  if (maNow === null || maPast === null || maPast === 0) return null;
  return (maNow - maPast) / maPast;
}

export function computeTrend(points: ExchangeRatePoint[]): ForexTrend {
  const ma20 = computeMovingAverage(points, TREND_MA_WINDOW);
  const ma60 = computeMovingAverage(points, TREND_REFERENCE_WINDOW);
  const slope = computeMaSlope(points, TREND_MA_WINDOW, TREND_SLOPE_LOOKBACK);
  if (ma20 === null || ma60 === null) return 'sideways';

  let position = 0;
  if (ma20 > ma60 * (1 + TREND_MA_POSITION_BAND)) position = 1;
  else if (ma20 < ma60 * (1 - TREND_MA_POSITION_BAND)) position = -1;

  let slopeScore = 0;
  if (slope !== null) {
    if (slope > TREND_SLOPE_BAND) slopeScore = 1;
    else if (slope < -TREND_SLOPE_BAND) slopeScore = -1;
  }

  const score = position + slopeScore;
  if (score >= 2) return 'up';
  if (score <= -2) return 'down';
  return 'sideways';
}

export function computeIndicators(points: ExchangeRatePoint[]): ForexIndicators {
  const current = points[points.length - 1]?.rate ?? 0;
  return {
    current,
    ma5: computeMovingAverage(points, 5),
    ma20: computeMovingAverage(points, 20),
    ma60: computeMovingAverage(points, 60),
    rsi14: computeRsi(points, 14),
    percentile52w: computePercentile(points, 252),
    percentile13w: computePercentile(points, 63),
    trend: computeTrend(points),
  };
}
