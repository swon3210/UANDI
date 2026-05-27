import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  type ExchangeRatePoint,
  type ForexIndicators,
  type ForexRange,
  type SupportedCurrency,
  computeIndicators,
} from '@uandi/investment-core';
import { fetchForexOutlook, fetchForexRates } from '@/services/forex';

const RATES_KEY = 'forexRates';
const OUTLOOK_KEY = 'forexOutlook';

export function useForexRates(currency: SupportedCurrency, range: ForexRange) {
  return useQuery({
    queryKey: [RATES_KEY, currency, range],
    queryFn: () => fetchForexRates(currency, range),
    staleTime: 5 * 60 * 1000,
  });
}

export function useForexIndicators(
  points: ExchangeRatePoint[] | undefined
): ForexIndicators | null {
  return useMemo(() => {
    if (!points || points.length === 0) return null;
    return computeIndicators(points);
  }, [points]);
}

export function useForexOutlook(
  currency: SupportedCurrency,
  points: ExchangeRatePoint[] | undefined,
  indicators: ForexIndicators | null,
  enabled = false
) {
  return useQuery({
    queryKey: [OUTLOOK_KEY, currency],
    queryFn: () => {
      if (!points || !indicators) throw new Error('데이터가 준비되지 않았습니다');
      const recent = points.slice(-90);
      return fetchForexOutlook({ currency, points: recent, indicators });
    },
    enabled: enabled && !!points && !!indicators && points.length >= 2,
    staleTime: 6 * 60 * 60 * 1000,
    retry: false,
  });
}
