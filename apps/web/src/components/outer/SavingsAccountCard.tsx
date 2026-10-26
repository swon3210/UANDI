import { Badge, Progress, cn } from '@uandi/ui';
import type { SavingsAccountInput } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { describeDepositCycle, type SavingsProjection } from '@/utils/savings';

type SavingsAccountCardProps = {
  account: SavingsAccountInput;
  projection: SavingsProjection;
  onClick?: () => void;
};

export function SavingsAccountCard({ account, projection, onClick }: SavingsAccountCardProps) {
  const progress =
    projection.totalPayments > 0 ? (projection.paidPayments / projection.totalPayments) * 100 : 0;

  return (
    <button
      type="button"
      data-testid="savings-account-card"
      onClick={onClick}
      className={cn(
        'block w-full rounded-xl border border-border bg-card p-4 text-left text-card-foreground transition-colors hover:bg-accent/40',
        projection.isMatured && 'bg-muted/40'
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="shrink-0 text-xs">
          {account.productType === 'deposit' ? '예금' : '적금'}
        </Badge>
        <p className="min-w-0 flex-1 truncate text-base font-semibold">{account.name}</p>
        <span
          data-testid="savings-account-dday"
          className={cn(
            'shrink-0 text-xs font-medium tabular-nums',
            projection.isMatured ? 'text-income' : 'text-primary'
          )}
        >
          {projection.isMatured ? '만기' : `D-${projection.daysToMaturity}`}
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {[account.bank, `연 ${account.interestRate}%`, describeDepositCycle(account)]
          .filter(Boolean)
          .join(' · ')}
      </p>

      {account.productType === 'installment' && (
        <div className="mt-3 flex items-center gap-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span data-testid="savings-account-progress" className="text-xs tabular-nums">
            {projection.paidPayments}/{projection.totalPayments}회
          </span>
        </div>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">납입 원금</dt>
          <dd data-testid="savings-account-principal" className="font-semibold tabular-nums">
            {formatCurrency(projection.currentPrincipal)}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-muted-foreground">만기 예상 (세후)</dt>
          <dd
            data-testid="savings-account-maturity"
            className="font-semibold tabular-nums text-income"
          >
            {formatCurrency(projection.maturityAmount)}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[11px] text-muted-foreground">
        이자 {formatCurrency(projection.interestBeforeTax)} − 세금 {formatCurrency(projection.tax)}{' '}
        · 예상치
      </p>
    </button>
  );
}
