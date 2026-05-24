import { describe, expect, it } from 'vitest';
import type { ForexIndicators } from '../../types';
import { computeRecommendation } from '../recommendation';

function makeIndicators(overrides: Partial<ForexIndicators>): ForexIndicators {
  return {
    current: 1400,
    ma5: 1400,
    ma20: 1400,
    ma60: 1400,
    rsi14: 50,
    percentile52w: 50,
    percentile13w: 50,
    trend: 'sideways',
    ...overrides,
  };
}

describe('computeRecommendation', () => {
  it('상승 추세에서는 52주 고점+RSI 과열이어도 매도가 아닌 중립', () => {
    const ind = makeIndicators({ percentile52w: 85, rsi14: 70, trend: 'up' });
    expect(computeRecommendation(ind)).toBe('hold');
  });

  it('횡보 추세에서는 52주 고점+RSI 과열이면 매도', () => {
    const ind = makeIndicators({ percentile52w: 80, rsi14: 68, trend: 'sideways' });
    expect(computeRecommendation(ind)).toBe('sell');
  });

  it('하락 추세 + 52주 저점 + RSI 약세는 매수', () => {
    const ind = makeIndicators({
      percentile52w: 15,
      percentile13w: 20,
      rsi14: 30,
      trend: 'down',
    });
    expect(computeRecommendation(ind)).toBe('buy');
  });

  it('52주는 저점 아니지만 13주 저점 + RSI 약세 + 하락 추세면 매수', () => {
    const ind = makeIndicators({
      percentile52w: 70,
      percentile13w: 15,
      rsi14: 38,
      trend: 'down',
    });
    expect(computeRecommendation(ind)).toBe('buy');
  });

  it('상승 추세에서는 13주 저점이어도 매수가 아닌 중립 (눌림목 함정 회피)', () => {
    const ind = makeIndicators({
      percentile52w: 70,
      percentile13w: 18,
      rsi14: 39,
      trend: 'up',
    });
    expect(computeRecommendation(ind)).toBe('hold');
  });

  it('중간 영역은 중립', () => {
    const ind = makeIndicators({
      percentile52w: 50,
      percentile13w: 50,
      rsi14: 50,
      trend: 'sideways',
    });
    expect(computeRecommendation(ind)).toBe('hold');
  });

  it('필수 지표가 null이면 중립', () => {
    const ind = makeIndicators({ rsi14: null });
    expect(computeRecommendation(ind)).toBe('hold');

    const ind2 = makeIndicators({ percentile13w: null });
    expect(computeRecommendation(ind2)).toBe('hold');
  });

  it('상승 추세 + 매도 조건은 hold로 다운그레이드 (기존 매도 신호 헛발동 차단)', () => {
    const ind = makeIndicators({
      percentile52w: 95,
      percentile13w: 90,
      rsi14: 75,
      trend: 'up',
    });
    expect(computeRecommendation(ind)).toBe('hold');
  });
});
