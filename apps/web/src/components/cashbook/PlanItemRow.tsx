'use client';

import { useState, useCallback, useRef } from 'react';
import { Input } from '@uandi/ui';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '@/utils/currency';

type PlanItemRowProps = {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  /** 'monthly' = 월별 고정, 'annual' = 연간 총액, 'target_months' = 시기 지정 */
  inputMode: 'monthly' | 'annual' | 'target_months';
  amount: number;
  targetMonths?: number[];
  onAmountChange: (annualAmount: number, monthlyAmount: number | null) => void;
  onTargetMonthsChange?: (months: number[]) => void;
};

export function PlanItemRow({
  categoryName,
  categoryIcon,
  categoryColor,
  inputMode,
  amount,
  targetMonths,
  onAmountChange,
  onTargetMonthsChange,
}: PlanItemRowProps) {
  const [localAmount, setLocalAmount] = useState(amount);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleAmountChange = (value: number) => {
    setLocalAmount(value);
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (inputMode === 'monthly') {
        onAmountChange(value * 12, value);
      } else {
        onAmountChange(value, null);
      }
    }, 500);
  };

  const annualTotal =
    inputMode === 'monthly' ? localAmount * 12 : localAmount;

  const perMonthDisplay =
    inputMode === 'target_months' && targetMonths && targetMonths.length > 0
      ? Math.round(localAmount / targetMonths.length)
      : null;

  const handleToggleMonth = useCallback(
    (month: number) => {
      if (!onTargetMonthsChange) return;
      const current = targetMonths ?? [];
      const next = current.includes(month)
        ? current.filter((m) => m !== month)
        : [...current, month].sort((a, b) => a - b);
      onTargetMonthsChange(next);
    },
    [targetMonths, onTargetMonthsChange]
  );

  return (
    <div data-testid={`plan-item-${categoryName}`} className="space-y-2">
      <div className="flex items-center gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
        >
          <CategoryIcon name={categoryIcon} size={18} />
        </span>
        <span className="text-sm font-medium flex-1 min-w-0">{categoryName}</span>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            className="w-32 text-right tabular-nums text-sm h-8"
            value={localAmount || ''}
            onChange={(e) => handleAmountChange(Number(e.target.value) || 0)}
            aria-label={`${categoryName} 금액`}
          />
          <span className="text-xs text-muted-foreground shrink-0">
            {inputMode === 'monthly' ? '/월' : '/년'}
          </span>
        </div>
      </div>

      {inputMode === 'monthly' && localAmount > 0 && (
        <div className="pl-11 text-xs text-muted-foreground">
          연간: {formatCurrency(annualTotal)}
        </div>
      )}

      {inputMode === 'target_months' && (
        <div className="pl-11 space-y-2">
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <button
                key={month}
                type="button"
                data-testid={`month-checkbox-${month}`}
                className={`text-xs rounded-md py-1 transition-colors ${
                  targetMonths?.includes(month)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-accent'
                }`}
                onClick={() => handleToggleMonth(month)}
              >
                {month}월
              </button>
            ))}
          </div>
          {perMonthDisplay != null && localAmount > 0 && (
            <div className="text-xs text-muted-foreground">
              선택: {targetMonths?.map((m) => `${m}월(${formatCurrency(perMonthDisplay)})`).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
