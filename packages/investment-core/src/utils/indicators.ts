import type { ExchangeRatePoint, ForexIndicators } from '../types';

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

export function computeIndicators(points: ExchangeRatePoint[]): ForexIndicators {
  const current = points[points.length - 1]?.rate ?? 0;
  return {
    current,
    ma5: computeMovingAverage(points, 5),
    ma20: computeMovingAverage(points, 20),
    ma60: computeMovingAverage(points, 60),
    rsi14: computeRsi(points, 14),
    percentile52w: computePercentile(points, 252),
  };
}
