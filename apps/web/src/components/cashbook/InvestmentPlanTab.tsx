'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import { Input, Badge, Separator } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';
import { PlanItemRow } from './PlanItemRow';
import type { AnnualPlanItem, CashbookCategory } from '@/types';
import { SUB_GROUP_LABELS } from '@/constants/default-categories';

type InvestmentPlanTabProps = {
  items: AnnualPlanItem[];
  categories: CashbookCategory[];
  totalIncome: number;
  totalExpense: number;
  targetReturnRate: number;
  onTargetReturnRateChange: (rate: number) => void;
  onItemAmountChange: (itemId: string, annualAmount: number, monthlyAmount: number | null) => void;
};

export function InvestmentPlanTab({
  items,
  categories,
  totalIncome,
  totalExpense,
  targetReturnRate,
  onTargetReturnRateChange,
  onItemAmountChange,
}: InvestmentPlanTabProps) {
  const availableAmount = totalIncome - totalExpense;
  const [localRate, setLocalRate] = useState(targetReturnRate);
  const debouncedRate = useDebounce(localRate, 500);

  useEffect(() => {
    setLocalRate(targetReturnRate);
  }, [targetReturnRate]);

  useEffect(() => {
    if (debouncedRate !== targetReturnRate) {
      onTargetReturnRateChange(debouncedRate);
    }
  }, [debouncedRate, targetReturnRate, onTargetReturnRateChange]);

  const targetAmount = Math.round(availableAmount * (1 + localRate / 100));
  const allocationTotal = items.reduce((sum, item) => sum + item.annualAmount, 0);
  const unallocated = availableAmount - allocationTotal;
  const isOverBudget = allocationTotal > availableAmount;

  const cashHoldingItems = items.filter((i) => i.subGroup === 'cash_holding');
  const investmentItems = items.filter((i) => i.subGroup === 'investment');

  const getCategoryInfo = useCallback(
    (categoryId: string) => categories.find((c) => c.id === categoryId),
    [categories]
  );

  return (
    <div className="space-y-6">
      {/* 가용 금액 카드 */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-2">
        <h3 className="text-sm font-medium">재테크 가능 금액</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">연간 수입</span>
            <span className="tabular-nums">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">연간 지출</span>
            <span className="tabular-nums">-{formatCurrency(totalExpense)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between font-medium">
            <span>가용 금액</span>
            <span className="tabular-nums" data-testid="available-amount">
              {formatCurrency(availableAmount)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <label htmlFor="target-rate" className="text-sm text-muted-foreground">
            목표 수익률
          </label>
          <Input
            id="target-rate"
            type="number"
            className="w-16 text-right text-sm h-8"
            value={localRate || ''}
            onChange={(e) => setLocalRate(Number(e.target.value) || 0)}
            aria-label="목표 수익률"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">목표 금액</span>
          <span className="font-medium tabular-nums" data-testid="target-amount">
            {formatCurrency(targetAmount)}
          </span>
        </div>
      </div>

      {/* 배분 계획 */}
      {cashHoldingItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {SUB_GROUP_LABELS.cash_holding}
          </h3>
          <div className="space-y-3">
            {cashHoldingItems.map((item) => {
              const cat = getCategoryInfo(item.categoryId);
              return (
                <PlanItemRow
                  key={item.id}
                  categoryName={cat?.name ?? ''}
                  categoryIcon={cat?.icon ?? ''}
                  categoryColor={cat?.color ?? '#5B8DEF'}
                  inputMode="annual"
                  amount={item.annualAmount}
                  onAmountChange={(annualAmount, monthlyAmount) =>
                    onItemAmountChange(item.id, annualAmount, monthlyAmount)
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {investmentItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {SUB_GROUP_LABELS.investment}
          </h3>
          <div className="space-y-3">
            {investmentItems.map((item) => {
              const cat = getCategoryInfo(item.categoryId);
              return (
                <PlanItemRow
                  key={item.id}
                  categoryName={cat?.name ?? ''}
                  categoryIcon={cat?.icon ?? ''}
                  categoryColor={cat?.color ?? '#5B8DEF'}
                  inputMode="annual"
                  amount={item.annualAmount}
                  onAmountChange={(annualAmount, monthlyAmount) =>
                    onItemAmountChange(item.id, annualAmount, monthlyAmount)
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 합계 */}
      <div className="rounded-xl bg-card border border-border p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span>배분 합계</span>
          <span className="font-semibold tabular-nums" data-testid="allocation-total">
            {formatCurrency(allocationTotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">미배분</span>
          <span
            className={`tabular-nums ${isOverBudget ? 'text-destructive font-semibold' : ''}`}
            data-testid="unallocated-amount"
          >
            {formatCurrency(unallocated)}
          </span>
        </div>
        {isOverBudget && (
          <Badge variant="destructive" data-testid="over-budget-warning" className="mt-1">
            배분 금액이 가용 금액을 초과했어요
          </Badge>
        )}
      </div>
    </div>
  );
}
