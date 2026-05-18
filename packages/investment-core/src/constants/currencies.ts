import type { ForexRange, SupportedCurrency } from '../types';

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['USD', 'JPY', 'EUR', 'CNY'];

export const FOREX_RANGES: ForexRange[] = ['1w', '1m', '3m', '6m', '1y', '5y'];

export const CURRENCY_META: Record<
  SupportedCurrency,
  {
    flag: string;
    label: string;
    displayUnit: string;
    displayMultiplier: number;
  }
> = {
  USD: { flag: '🇺🇸', label: '미국 달러', displayUnit: '달러', displayMultiplier: 1 },
  JPY: { flag: '🇯🇵', label: '일본 엔(100엔)', displayUnit: '100엔', displayMultiplier: 100 },
  EUR: { flag: '🇪🇺', label: '유로', displayUnit: '유로', displayMultiplier: 1 },
  CNY: { flag: '🇨🇳', label: '중국 위안', displayUnit: '위안', displayMultiplier: 1 },
};

export function getDisplayRate(rate: number, currency: SupportedCurrency): number {
  return rate * CURRENCY_META[currency].displayMultiplier;
}

export const RANGE_DAYS: Record<ForexRange, number> = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  '5y': 365 * 5,
};

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as string[]).includes(value);
}

export function isForexRange(value: string): value is ForexRange {
  return (FOREX_RANGES as string[]).includes(value);
}
