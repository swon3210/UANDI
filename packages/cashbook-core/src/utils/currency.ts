import type { CashbookEntryType } from '../types';

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

export function formatAmount(amount: number, type: CashbookEntryType): string {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}${amount.toLocaleString('ko-KR')}원`;
}
