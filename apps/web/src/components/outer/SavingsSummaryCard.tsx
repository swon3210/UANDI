import { PiggyBank } from 'lucide-react';
import { Skeleton } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';

type SavingsSummaryCardProps = {
  currentPrincipal: number;
  maturityAmount: number;
  activeCount: number;
  isLoading?: boolean;
};

export function SavingsSummaryCard({
  currentPrincipal,
  maturityAmount,
  activeCount,
  isLoading,
}: SavingsSummaryCardProps) {
  return (
    <section
      data-testid="savings-summary-card"
      className="rounded-xl border border-border bg-card p-4 text-card-foreground"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <PiggyBank size={16} className="text-primary" />
        지금까지 모은 돈
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-40" />
      ) : (
        <p data-testid="savings-summary-principal" className="mt-1 text-2xl font-bold tabular-nums">
          {formatCurrency(currentPrincipal)}
        </p>
      )}
      <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
        <div>
          <p className="text-xs text-muted-foreground">만기 예상 수령액 (세후)</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-5 w-28" />
          ) : (
            <p
              data-testid="savings-summary-maturity"
              className="text-base font-semibold tabular-nums text-income"
            >
              {formatCurrency(maturityAmount)}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">진행 중 {activeCount}개</p>
      </div>
    </section>
  );
}
