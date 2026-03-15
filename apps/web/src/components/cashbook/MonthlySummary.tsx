'use client';

import { formatCurrency } from '@/utils/currency';

type MonthlySummaryProps = {
  income: number;
  expense: number;
  balance: number;
};

export function MonthlySummary({ income, expense, balance }: MonthlySummaryProps) {
  return (
    <div
      className="rounded-xl bg-card border border-border p-4 space-y-2"
      data-testid="monthly-summary"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">수입</span>
        <span className="text-base font-semibold tabular-nums text-income">
          +{formatCurrency(income)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">지출</span>
        <span className="text-base font-semibold tabular-nums text-expense">
          -{formatCurrency(expense)}
        </span>
      </div>
      <div className="border-t border-border pt-2 flex items-center justify-between">
        <span className="text-sm font-medium">잔액</span>
        <span className="text-base font-bold tabular-nums">{formatCurrency(balance)}</span>
      </div>
    </div>
  );
}
