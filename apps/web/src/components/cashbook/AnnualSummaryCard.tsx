'use client';

import { Separator } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';

type AnnualSummaryCardProps = {
  totalIncome: number;
  totalExpense: number;
  investmentAllocated: number;
  flexTotal: number;
};

export function AnnualSummaryCard({
  totalIncome,
  totalExpense,
  investmentAllocated,
  flexTotal,
}: AnnualSummaryCardProps) {
  return (
    <div
      className="rounded-xl bg-card border border-border p-4 space-y-2"
      data-testid="annual-summary-card"
    >
      <SummaryRow label="수입" amount={totalIncome} colorClass="text-income" prefix="+" />
      <SummaryRow label="지출" amount={totalExpense} colorClass="text-expense" prefix="-" />
      <Separator className="my-2" />
      <SummaryRow label="재테크" amount={investmentAllocated} />
      <SummaryRow label="Flex" amount={flexTotal} />
    </div>
  );
}

function SummaryRow({
  label,
  amount,
  colorClass = '',
  prefix = '',
}: {
  label: string;
  amount: number;
  colorClass?: string;
  prefix?: string;
}) {
  return (
    <div
      className="flex items-center justify-between"
      data-testid={`summary-row-${label}`}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-base font-semibold tabular-nums ${colorClass}`}
        data-testid="summary-amount"
      >
        {prefix}{formatCurrency(amount)}
      </span>
    </div>
  );
}
