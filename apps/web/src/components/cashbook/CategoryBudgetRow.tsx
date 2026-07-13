'use client';

import { ChevronRight } from 'lucide-react';
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
  /** 지정하면 행 전체가 눌러지는 버튼이 되어 해당 카테고리 내역으로 이동한다. */
  onClick?: () => void;
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
  onClick,
}: CategoryBudgetRowProps) {
  const content = (
    <>
      <div className="flex items-center gap-2">
        <CategoryIcon name={icon} size={18} />
        <span className="text-sm font-medium flex-1">{categoryName}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{percentage}%</span>
        {onClick && (
          <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden />
        )}
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
    </>
  );

  const baseClass = 'space-y-1.5 py-3 border-b border-border last:border-b-0';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${categoryName} 내역 보기`}
        className={`${baseClass} w-full rounded-lg text-left transition-colors hover:bg-muted/40 active:bg-muted/60`}
        data-testid={`category-budget-${categoryName}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={baseClass} data-testid={`category-budget-${categoryName}`}>
      {content}
    </div>
  );
}
