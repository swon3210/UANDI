'use client';

import { Progress, Badge } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';
import type { BudgetStatus } from '@/hooks/useMonthlyBudget';
import { getStatusLabel, getStatusEmoji, getStatusColor } from '@/hooks/useMonthlyBudget';

const PROGRESS_CLASS: Record<BudgetStatus, string> = {
  stable: 'h-2.5 [&>div]:bg-income',
  warning: 'h-2.5 [&>div]:bg-warning',
  danger: 'h-2.5 [&>div]:bg-expense',
};

type WeeklySummaryCardProps = {
  budget: number;
  carryOver?: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
};

export function WeeklySummaryCard({
  budget,
  carryOver,
  spent,
  remaining,
  percentage,
  status,
}: WeeklySummaryCardProps) {
  return (
    <div
      className="rounded-xl bg-card border border-border p-4 space-y-4"
      data-testid="weekly-summary"
    >
      <h3 className="text-base font-semibold">주간 현황</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">예산</span>
          <span className="text-sm font-semibold tabular-nums">{formatCurrency(budget)}</span>
        </div>
        {carryOver != null && carryOver !== 0 && (
          <div className="flex items-center justify-between pl-2">
            <span className="text-xs text-muted-foreground">이월</span>
            <span
              className={`text-xs tabular-nums ${carryOver > 0 ? 'text-income' : 'text-expense'}`}
            >
              {carryOver > 0 ? '+' : ''}
              {formatCurrency(carryOver)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">지출</span>
          <span className="text-sm font-semibold tabular-nums text-expense">
            -{formatCurrency(spent)}
          </span>
        </div>
        <div className="border-t border-border pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">여유</span>
            <span className={`text-sm font-semibold tabular-nums ${getStatusColor(status)}`}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Progress value={percentage} className={PROGRESS_CLASS[status]} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{percentage}%</span>
          <Badge variant="outline" className={getStatusColor(status)} data-testid="weekly-status">
            {getStatusEmoji(status)} {getStatusLabel(status)}
          </Badge>
        </div>
      </div>
    </div>
  );
}
