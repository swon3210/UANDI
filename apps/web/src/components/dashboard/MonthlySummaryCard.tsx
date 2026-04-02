'use client';

import Link from 'next/link';
import { Button, Skeleton, cn } from '@uandi/ui';
import { useMonthlyEntries, useMonthlySummary } from '@/hooks/useCashbook';
import { formatCurrency } from '@/utils/currency';

type MonthlySummaryCardProps = {
  coupleId: string;
};

export function MonthlySummaryCard({ coupleId }: MonthlySummaryCardProps) {
  const { data: entries, isLoading } = useMonthlyEntries(coupleId);
  const summary = useMonthlySummary(entries);

  return (
    <section data-testid="monthly-summary">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">이번 달 가계부</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/cashbook/history">전체 보기</Link>
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : (
        <div className="rounded-xl border border-border p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">수입</span>
            <span
              data-testid="summary-income"
              className="text-lg font-semibold tabular-nums text-income"
            >
              +{formatCurrency(summary.income)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">지출</span>
            <span
              data-testid="summary-expense"
              className="text-lg font-semibold tabular-nums text-expense"
            >
              -{formatCurrency(summary.expense)}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-2">
            <span className="text-sm text-muted-foreground">잔액</span>
            <span
              data-testid="summary-balance"
              className={cn(
                'text-lg font-semibold tabular-nums',
                summary.balance > 0 && 'text-income',
                summary.balance < 0 && 'text-expense',
                summary.balance === 0 && 'text-muted-foreground'
              )}
            >
              {formatCurrency(summary.balance)}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
