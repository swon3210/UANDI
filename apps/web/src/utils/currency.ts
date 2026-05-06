export { formatCurrency, formatAmount } from '@uandi/cashbook-core';

/**
 * 큰 금액을 만/억 단위로 축약. 예: 12,345,000 → "1,235만", 120,000,000 → "1.2억"
 * 1만 미만은 그대로 표시.
 */
export function formatCurrencyMan(n: number): string {
  if (n === 0) return '0';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 100000000) {
    const eok = abs / 100000000;
    const rounded = Math.round(eok * 10) / 10;
    return `${sign}${rounded.toString().replace(/\.0$/, '')}억`;
  }
  if (abs >= 10000) {
    return `${sign}${Math.round(abs / 10000).toLocaleString('ko-KR')}만`;
  }
  return `${sign}${abs.toLocaleString('ko-KR')}`;
}
