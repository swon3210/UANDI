import type { CurrencyCategory, ForexRange, SupportedCurrency } from '../types';

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  'USD',
  'EUR',
  'GBP',
  'CHF',
  'AUD',
  'CAD',
  'NZD',
  'JPY',
  'CNY',
  'HKD',
  'SGD',
  'INR',
  'THB',
  'IDR',
  'MYR',
  'PHP',
];

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
  EUR: { flag: '🇪🇺', label: '유로', displayUnit: '유로', displayMultiplier: 1 },
  GBP: { flag: '🇬🇧', label: '영국 파운드', displayUnit: '파운드', displayMultiplier: 1 },
  CHF: { flag: '🇨🇭', label: '스위스 프랑', displayUnit: '프랑', displayMultiplier: 1 },
  AUD: { flag: '🇦🇺', label: '호주 달러', displayUnit: '달러', displayMultiplier: 1 },
  CAD: { flag: '🇨🇦', label: '캐나다 달러', displayUnit: '달러', displayMultiplier: 1 },
  NZD: { flag: '🇳🇿', label: '뉴질랜드 달러', displayUnit: '달러', displayMultiplier: 1 },
  JPY: { flag: '🇯🇵', label: '일본 엔(100엔)', displayUnit: '100엔', displayMultiplier: 100 },
  CNY: { flag: '🇨🇳', label: '중국 위안', displayUnit: '위안', displayMultiplier: 1 },
  HKD: { flag: '🇭🇰', label: '홍콩 달러', displayUnit: '달러', displayMultiplier: 1 },
  SGD: { flag: '🇸🇬', label: '싱가포르 달러', displayUnit: '달러', displayMultiplier: 1 },
  INR: { flag: '🇮🇳', label: '인도 루피', displayUnit: '루피', displayMultiplier: 1 },
  THB: { flag: '🇹🇭', label: '태국 바트', displayUnit: '바트', displayMultiplier: 1 },
  IDR: {
    flag: '🇮🇩',
    label: '인도네시아 루피아(100루피아)',
    displayUnit: '100루피아',
    displayMultiplier: 100,
  },
  MYR: { flag: '🇲🇾', label: '말레이시아 링깃', displayUnit: '링깃', displayMultiplier: 1 },
  PHP: { flag: '🇵🇭', label: '필리핀 페소', displayUnit: '페소', displayMultiplier: 1 },
};

export const CATEGORY_LABEL: Record<CurrencyCategory, string> = {
  major: '메이저',
  asia: '아시아',
  europe: '유럽',
  emerging: '신흥',
};

export const CATEGORY_ORDER: CurrencyCategory[] = ['major', 'asia', 'europe', 'emerging'];

export const CURRENCY_CATEGORY: Record<SupportedCurrency, CurrencyCategory> = {
  USD: 'major',
  EUR: 'major',
  GBP: 'major',
  CHF: 'major',
  AUD: 'major',
  CAD: 'major',
  NZD: 'major',
  JPY: 'asia',
  CNY: 'asia',
  HKD: 'asia',
  SGD: 'asia',
  INR: 'asia',
  THB: 'asia',
  IDR: 'asia',
  MYR: 'asia',
  PHP: 'asia',
};

export function getCurrenciesByCategory(): Array<{
  category: CurrencyCategory;
  currencies: SupportedCurrency[];
}> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    currencies: SUPPORTED_CURRENCIES.filter((c) => CURRENCY_CATEGORY[c] === category),
  })).filter((group) => group.currencies.length > 0);
}

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
