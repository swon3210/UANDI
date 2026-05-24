import { describe, expect, it } from 'vitest';
import type { ExchangeRatePoint } from '../../types';
import { computeIndicators, computeTrend } from '../indicators';

function makeSeries(values: number[]): ExchangeRatePoint[] {
  return values.map((rate, i) => ({
    date: new Date(2024, 0, i + 1).toISOString().slice(0, 10),
    rate,
  }));
}

function linspace(start: number, end: number, count: number): number[] {
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + step * i);
}

describe('computeTrend', () => {
  it('단조 상승 시계열은 up', () => {
    const points = makeSeries(linspace(1300, 1450, 80));
    expect(computeTrend(points)).toBe('up');
  });

  it('단조 하락 시계열은 down', () => {
    const points = makeSeries(linspace(1450, 1300, 80));
    expect(computeTrend(points)).toBe('down');
  });

  it('일정값 시계열은 sideways', () => {
    const points = makeSeries(Array(80).fill(1400));
    expect(computeTrend(points)).toBe('sideways');
  });

  it('좁은 폭의 진동(평균 변화 거의 0)은 sideways', () => {
    const values = Array.from({ length: 80 }, (_, i) => 1400 + (i % 2 === 0 ? 1 : -1));
    expect(computeTrend(makeSeries(values))).toBe('sideways');
  });

  it('데이터가 부족하면 sideways (안전 기본값)', () => {
    const points = makeSeries([1400, 1401, 1402]);
    expect(computeTrend(points)).toBe('sideways');
  });
});

describe('computeIndicators', () => {
  it('percentile13w와 trend 필드를 포함한다', () => {
    const points = makeSeries(linspace(1300, 1450, 80));
    const indicators = computeIndicators(points);
    expect(indicators.percentile13w).not.toBeNull();
    expect(indicators.trend).toBe('up');
  });
});
