import {
  formatAmount as coreFormatAmount,
  formatCurrency as coreFormatCurrency,
  toWonAmount,
  type CashbookEntryType,
} from '@uandi/cashbook-core';
import { getActiveLocale, INTL_LOCALE_TAGS } from '@/lib/locale';

export { toWonAmount };

/**
 * 현재 표시 언어에 맞춘 원화 표기. 금액은 원화 고정(범위 A), 표기만 바뀐다.
 *   ko: "12,000원" / en: "₩12,000"
 * 로케일은 `<html lang>`(서버가 요청마다 확정)에서 읽는다 — lib/locale.ts getActiveLocale 참고.
 */
export function formatCurrency(amount: number): string {
  return coreFormatCurrency(amount, getActiveLocale());
}

export function formatAmount(amount: number, type: CashbookEntryType): string {
  return coreFormatAmount(amount, type, getActiveLocale());
}

/**
 * 큰 금액을 축약한다.
 *   ko: 만/억 단위 — 12,345,000 → "1,235만", 120,000,000 → "1.2억" (1만 미만은 그대로)
 *   en: compact 표기 — 12,345,000 → "₩12.3M", 120,000,000 → "₩120M" (1천 미만은 그대로)
 * `manDecimals` 옵션은 ko 의 만 단위 소수 자릿수(예: 1 → "324.4만"). en 은 최대 1자리로 고정.
 */
export function formatCurrencyMan(n: number, options: { manDecimals?: number } = {}): string {
  const won = toWonAmount(n);
  if (won === 0) return '0';
  const sign = won < 0 ? '-' : '';
  const abs = Math.abs(won);

  if (getActiveLocale() === 'en') {
    const compact = abs.toLocaleString(INTL_LOCALE_TAGS.en, {
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    return `${sign}₩${compact}`;
  }

  if (abs >= 100000000) {
    const eok = abs / 100000000;
    const rounded = Math.round(eok * 10) / 10;
    return `${sign}${rounded.toString().replace(/\.0$/, '')}억`;
  }
  if (abs >= 10000) {
    const decimals = options.manDecimals ?? 0;
    const factor = 10 ** decimals;
    const value = Math.round((abs / 10000) * factor) / factor;
    return `${sign}${value.toLocaleString('ko-KR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    })}만`;
  }
  return `${sign}${abs.toLocaleString('ko-KR')}`;
}

/**
 * 환율처럼 소수 2자리까지 보여주는 원화 표기.
 *   ko: "1,394.50원" / en: "₩1,394.50" (음수는 부호를 맨 앞에 붙인다)
 */
export function formatKrwRate(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}${coreFormatCurrency(1, getActiveLocale()).replace('1', formatRateNumber(Math.abs(value)))}`;
}

/** 원화 기호 없이 소수 2자리로 고정한 숫자 표기 (기호를 따로 스타일링할 때) */
export function formatRateNumber(value: number): string {
  return value.toLocaleString(INTL_LOCALE_TAGS[getActiveLocale()], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
