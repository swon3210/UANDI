import type { ExchangeRatePoint, ForexRatesPayload, SupportedCurrency } from '../types';

type FrankfurterRangeResponse = {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
};

export function buildFrankfurterRangeUrl(
  currency: SupportedCurrency,
  startDate: string,
  endDate: string
): string {
  return `https://api.frankfurter.app/${startDate}..${endDate}?from=${currency}&to=KRW`;
}

export function parseFrankfurterRange(
  currency: SupportedCurrency,
  data: FrankfurterRangeResponse,
  fetchedAt: string
): ForexRatesPayload {
  const points: ExchangeRatePoint[] = Object.entries(data.rates)
    .map(([date, ratesByCurrency]) => ({
      date,
      rate: ratesByCurrency.KRW,
    }))
    .filter((p) => typeof p.rate === 'number')
    .sort((a, b) => a.date.localeCompare(b.date));

  const latest = points[points.length - 1]?.rate ?? 0;
  const prevClose = points.length >= 2 ? points[points.length - 2].rate : null;
  const asOf = points[points.length - 1]?.date ?? data.end_date;

  return { currency, points, latest, prevClose, asOf, fetchedAt };
}
