'use client';

import { Progress, Badge } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';
import type { BudgetStatus } from '@/hooks/useMonthlyBudget';
import { getStatusLabel, getStatusEmoji, getStatusColor } from '@/hooks/useMonthlyBudget';

const EXPENSE_PROGRESS_CLASS: Record<BudgetStatus, string> = {
  stable: 'h-2.5 [&>div]:bg-income',
  warning: 'h-2.5 [&>div]:bg-warning',
  danger: 'h-2.5 [&>div]:bg-expense',
};

type MonthlyOverviewProps = {
  incomeBudget: number;
  incomeActual: number;
  expenseBudget: number;
  expenseActual: number;
  balance: number;
  margin: number;
  status: BudgetStatus;
};

export function MonthlyOverview({
  incomeBudget,
  incomeActual,
  expenseBudget,
  expenseActual,
  balance,
  margin,
  status,
}: MonthlyOverviewProps) {
  const incomePercent =
    incomeBudget > 0 ? Math.min(Math.round((incomeActual / incomeBudget) * 100), 100) : 0;
  const expensePercent =
    expenseBudget > 0 ? Math.min(Math.round((expenseActual / expenseBudget) * 100), 100) : 0;

  return (
    <div
      className="rounded-xl bg-card border border-border p-4 space-y-4"
      data-testid="monthly-overview"
    >
      <h3 className="text-base font-semibold">이번 달 현황</h3>

      {/* 수입 프로그레스 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">수입</span>
          <span className="text-xs text-muted-foreground">{incomePercent}%</span>
        </div>
        <Progress value={incomePercent} className="h-2.5 [&>div]:bg-income" />
        <div className="flex justify-end">
          <span className="text-sm tabular-nums">
            <span className="font-semibold text-income">{formatCurrency(incomeActual)}</span>
            <span className="text-muted-foreground"> / {formatCurrency(incomeBudget)}</span>
          </span>
        </div>
      </div>

      {/* 지출 프로그레스 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">지출</span>
          <span className="text-xs text-muted-foreground">{expensePercent}%</span>
        </div>
        <Progress value={expensePercent} className={EXPENSE_PROGRESS_CLASS[status]} />
        <div className="flex justify-end">
          <span className="text-sm tabular-nums">
            <span className={`font-semibold ${getStatusColor(status)}`}>
              {formatCurrency(expenseActual)}
            </span>
            <span className="text-muted-foreground"> / {formatCurrency(expenseBudget)}</span>
          </span>
        </div>
      </div>

      {/* 요약 */}
      <div className="border-t border-border pt-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">잔액</span>
          <span className="text-sm font-semibold tabular-nums">{formatCurrency(balance)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">여유분</span>
          <span className={`text-sm font-semibold tabular-nums ${getStatusColor(status)}`}>
            {formatCurrency(margin)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">상태</span>
          <Badge variant="outline" className={getStatusColor(status)} data-testid="budget-status">
            {getStatusEmoji(status)} {getStatusLabel(status)}
          </Badge>
        </div>
      </div>
    </div>
  );
}
