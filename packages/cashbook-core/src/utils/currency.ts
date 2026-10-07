import type { CashbookEntryType } from '../types';

// 원화는 소수점이 없다. 합산 결과에 소수 금액이 섞여도 원 단위로 반올림해 표기한다.
// (`|| 0`은 -0.4 같은 값이 "-0"으로 표기되는 것을 막는다)
function toWon(amount: number): string {
  return (Math.round(amount) || 0).toLocaleString('ko-KR');
}

export function formatCurrency(amount: number): string {
  return `${toWon(amount)}원`;
}

export function formatAmount(amount: number, type: CashbookEntryType): string {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}${toWon(amount)}원`;
}
