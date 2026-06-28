'use client';

import { Progress, Badge } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';
import type { BudgetStatus } from '@/hooks/useMonthlyBudget';
import { getStatusColor } from '@/hooks/useMonthlyBudget';
import { CategoryIcon } from './CategoryIcon';

const PROGRESS_CLASS: Record<BudgetStatus, string> = {
  stable: 'h-2 [&>div]:bg-income',
  warning: 'h-2 [&>div]:bg-warning',
  danger: 'h-2 [&>div]:bg-expense',
};

type CategoryBudgetRowProps = {
  categoryName: string;
  icon: string;
  budgetAmount: number;
  actualAmount: number;
  percentage: number;
  status: BudgetStatus;
  margin: number;
};

function getMarginLabel(status: BudgetStatus, margin: number): string {
  if (margin < 0) return `초과: ${formatCurrency(Math.abs(margin))}`;
  if (margin === 0) return '예산 소진';
  // 예산 80% 이상 사용(warning)은 '여유'가 아니라 '주의'로 구분한다.
  if (status === 'warning') return `주의: ${formatCurrency(margin)}`;
  return `여유: ${formatCurrency(margin)}`;
}

function getMarginBadgeIcon(status: BudgetStatus, margin: number): string {
  if (margin === 0) return '⚪';
  switch (status) {
    case 'stable':
      return '🟢';
    case 'warning':
      return '🟡';
    case 'danger':
      return '🔴';
  }
}

export function CategoryBudgetRow({
  categoryName,
  icon,
  budgetAmount,
  actualAmount,
  percentage,
  status,
  margin,
}: CategoryBudgetRowProps) {
  return (
    <div
      className="space-y-1.5 py-3 border-b border-border last:border-b-0"
      data-testid={`category-budget-${categoryName}`}
    >
      <div className="flex items-center gap-2">
        <CategoryIcon name={icon} size={18} />
        <span className="text-sm font-medium flex-1">{categoryName}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{percentage}%</span>
      </div>
      <Progress value={percentage} className={PROGRESS_CLASS[status]} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCurrency(actualAmount)} / {formatCurrency(budgetAmount)}
        </span>
        <Badge variant="outline" className={`text-xs ${getStatusColor(status)}`}>
          {getMarginBadgeIcon(status, margin)} {getMarginLabel(status, margin)}
        </Badge>
      </div>
    </div>
  );
}
