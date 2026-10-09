import type { CashbookEntryType } from '../types';

/**
 * 원화 금액을 원 단위 정수로 맞춘다. 원화는 소수점이 없으므로 저장·합산·표기 전에 사용한다.
 * (`|| 0`은 -0.4 같은 값이 -0이 되어 "-0"으로 표기되는 것을 막는다)
 */
export function toWonAmount(amount: number): number {
  return Math.round(amount) || 0;
}

export function formatCurrency(amount: number): string {
  return `${toWonAmount(amount).toLocaleString('ko-KR')}원`;
}

export function formatAmount(amount: number, type: CashbookEntryType): string {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}${toWonAmount(amount).toLocaleString('ko-KR')}원`;
}
