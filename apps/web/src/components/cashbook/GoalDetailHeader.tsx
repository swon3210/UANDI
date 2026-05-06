'use client';

import { cn } from '@uandi/ui';
import { formatCurrencyMan } from '@/utils/currency';
import type { GoalCategoryTheme } from '@/constants/goal-categories';

type GoalDetailHeaderProps = {
  theme: GoalCategoryTheme;
  /** 항목 합계 (sum of annualAmount) */
  itemsTotal: number;
  /** 현재 달성액 (옵션) */
  actual?: number;
};

export function GoalDetailHeader({
  theme,
  itemsTotal,
  actual,
}: GoalDetailHeaderProps) {
  const monthly = Math.round(itemsTotal / 12);
  const pct = itemsTotal > 0 && actual != null ? Math.round((actual / itemsTotal) * 100) : 0;
  const showProgress = actual != null && itemsTotal > 0;

  return (
    <div
      className={cn(
        'rounded-2xl border-[1.5px] p-5',
        theme.softBgClass,
        theme.softBorderClass
      )}
      data-testid={`goal-detail-header-${theme.key}`}
    >
      <div className={cn('text-xs font-semibold opacity-80', theme.accentClass)}>
        {theme.goalLabel}
      </div>
      <div
        className={cn(
          'mt-1 text-[30px] font-extrabold tabular-nums leading-tight',
          theme.accentClass
        )}
        data-testid={`goal-detail-header-${theme.key}-amount`}
      >
        {formatCurrencyMan(itemsTotal)}원
      </div>

      <div className={cn('mt-1 text-[13px] font-medium', theme.accentClass)}>
        월 {formatCurrencyMan(monthly)}원
      </div>

      {showProgress && (
        <div className="mt-3.5">
          <div className="h-[7px] overflow-hidden rounded-full bg-white/60">
            <div
              className={cn('h-full rounded-full transition-[width]', theme.accentBgClass)}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div
            className={cn(
              'mt-1.5 flex justify-between text-[11px] opacity-70',
              theme.accentClass
            )}
          >
            <span>달성 {pct}%</span>
            <span>현재 {formatCurrencyMan(actual!)}원</span>
          </div>
        </div>
      )}
    </div>
  );
}
