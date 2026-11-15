import type {
  ForexIndicators,
  ForexOutlook,
  ForexRange,
  ForexRatesPayload,
  SupportedCurrency,
} from '@uandi/investment-core';
import { getAuth } from '@/lib/firebase/config';

export async function fetchForexRates(
  currency: SupportedCurrency,
  range: ForexRange
): Promise<ForexRatesPayload> {
  const res = await fetch(`/api/forex/rates?currency=${currency}&range=${range}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? 'FOREX_RATES_FAILED');
  }
  return res.json();
}

export async function fetchForexOutlook(params: {
  currency: SupportedCurrency;
  points: { date: string; rate: number }[];
  indicators: ForexIndicators;
}): Promise<ForexOutlook> {
  const auth = getAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('NOT_AUTHENTICATED');
  const token = await user.getIdToken();

  const res = await fetch('/api/ai/forex-outlook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? 'FOREX_OUTLOOK_FAILED');
  }

  return res.json();
}
