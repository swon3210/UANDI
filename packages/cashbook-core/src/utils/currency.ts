import type { CashbookEntryType } from '../types';

/** 통화 표기 로케일. 금액 자체는 원화(KRW) 고정이고 표기 방식만 다르다("1,000원" / "₩1,000"). */
export type CurrencyLocale = 'ko' | 'en';

/**
 * 원화 금액을 원 단위 정수로 맞춘다. 원화는 소수점이 없으므로 저장·합산·표기 전에 사용한다.
 * (`|| 0`은 -0.4 같은 값이 -0이 되어 "-0"으로 표기되는 것을 막는다)
 */
export function toWonAmount(amount: number): number {
  return Math.round(amount) || 0;
}

/** 부호 없는 원화 숫자 부분. ko: "1,234" / en: "₩1,234" */
function formatWonUnsigned(abs: number, locale: CurrencyLocale): string {
  return locale === 'en' ? `₩${abs.toLocaleString('en-US')}` : abs.toLocaleString('ko-KR');
}

export function formatCurrency(amount: number, locale: CurrencyLocale = 'ko'): string {
  const won = toWonAmount(amount);
  if (locale === 'en') {
    const sign = won < 0 ? '-' : '';
    return `${sign}${formatWonUnsigned(Math.abs(won), 'en')}`;
  }
  return `${won.toLocaleString('ko-KR')}원`;
}

export function formatAmount(
  amount: number,
  type: CashbookEntryType,
  locale: CurrencyLocale = 'ko'
): string {
  const prefix = type === 'income' ? '+' : '-';
  const won = toWonAmount(amount);
  if (locale === 'en') return `${prefix}${formatWonUnsigned(Math.abs(won), 'en')}`;
  return `${prefix}${won.toLocaleString('ko-KR')}원`;
}
