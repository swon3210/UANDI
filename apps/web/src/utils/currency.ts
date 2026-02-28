// TODO: 금액 포맷 유틸 구현
// 구현 명세: docs/pages/04-cashbook.md
//
// formatAmount(amount, type): "+1,234,000원" | "-45,000원"
// formatCurrency(amount): "1,234,000원"

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

export function formatAmount(amount: number, type: 'income' | 'expense'): string {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}${amount.toLocaleString('ko-KR')}원`;
}
