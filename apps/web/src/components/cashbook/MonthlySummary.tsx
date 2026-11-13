'use client';

import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/utils/currency';

type MonthlySummaryProps = {
  income: number;
  expense: number;
  balance: number;
};

export function MonthlySummary({ income, expense, balance }: MonthlySummaryProps) {
  const t = useTranslations('cashbook.monthlySummary');
  return (
    <div
      className="rounded-xl bg-card border border-border p-4 space-y-2"
      data-testid="monthly-summary"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t('income')}</span>
        <span className="text-base font-semibold tabular-nums text-income">
          +{formatCurrency(income)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t('expense')}</span>
        <span className="text-base font-semibold tabular-nums text-expense">
          -{formatCurrency(expense)}
        </span>
      </div>
      <div className="border-t border-border pt-2 flex items-center justify-between">
        <span className="text-sm font-medium">{t('balance')}</span>
        <span className="text-base font-bold tabular-nums">{formatCurrency(balance)}</span>
      </div>
    </div>
  );
}
