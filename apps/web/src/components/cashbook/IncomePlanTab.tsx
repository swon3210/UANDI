'use client';

import { useCallback } from 'react';
import { formatCurrency } from '@/utils/currency';
import { PlanItemRow } from './PlanItemRow';
import { PreviousYearSuggestion } from './PreviousYearSuggestion';
import type { AnnualPlanItem, CashbookCategory } from '@/types';
import { SUB_GROUP_LABELS } from '@/constants/default-categories';

type IncomePlanTabProps = {
  items: AnnualPlanItem[];
  categories: CashbookCategory[];
  previousYearItems?: AnnualPlanItem[];
  onItemAmountChange: (itemId: string, annualAmount: number, monthlyAmount: number | null) => void;
  onApplySuggestion?: (itemId: string, amount: number) => void;
};

export function IncomePlanTab({
  items,
  categories,
  previousYearItems,
  onItemAmountChange,
  onApplySuggestion,
}: IncomePlanTabProps) {
  const regularItems = items.filter((i) => i.subGroup === 'regular_income');
  const irregularItems = items.filter((i) => i.subGroup === 'irregular_income');

  const getCategoryInfo = useCallback(
    (categoryId: string) => categories.find((c) => c.id === categoryId),
    [categories]
  );

  const getPreviousAmount = useCallback(
    (categoryId: string) => {
      if (!previousYearItems) return null;
      const prev = previousYearItems.find((i) => i.categoryId === categoryId);
      return prev?.annualAmount ?? null;
    },
    [previousYearItems]
  );

  const total = items.reduce((sum, item) => sum + item.annualAmount, 0);

  return (
    <div className="space-y-6">
      <SubGroupSection
        label={SUB_GROUP_LABELS.regular_income}
        items={regularItems}
        inputMode="monthly"
        getCategoryInfo={getCategoryInfo}
        onItemAmountChange={onItemAmountChange}
      />

      <SubGroupSection
        label={SUB_GROUP_LABELS.irregular_income}
        items={irregularItems}
        inputMode="annual"
        getCategoryInfo={getCategoryInfo}
        onItemAmountChange={onItemAmountChange}
        getPreviousAmount={getPreviousAmount}
        onApplySuggestion={onApplySuggestion}
      />

      <div
        className="rounded-xl bg-card border border-border p-3 flex items-center justify-between"
        data-testid="total-income"
      >
        <span className="text-sm font-medium">총 연간 수입</span>
        <span className="text-base font-bold tabular-nums text-income">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}

function SubGroupSection({
  label,
  items,
  inputMode,
  getCategoryInfo,
  onItemAmountChange,
  getPreviousAmount,
  onApplySuggestion,
}: {
  label: string;
  items: AnnualPlanItem[];
  inputMode: 'monthly' | 'annual';
  getCategoryInfo: (categoryId: string) => CashbookCategory | undefined;
  onItemAmountChange: (itemId: string, annualAmount: number, monthlyAmount: number | null) => void;
  getPreviousAmount?: (categoryId: string) => number | null;
  onApplySuggestion?: (itemId: string, amount: number) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const cat = getCategoryInfo(item.categoryId);
          const prevAmount = getPreviousAmount?.(item.categoryId);

          return (
            <div key={item.id} className="space-y-2">
              <PlanItemRow
                categoryName={cat?.name ?? ''}
                categoryIcon={cat?.icon ?? ''}
                categoryColor={cat?.color ?? '#78909C'}
                inputMode={inputMode}
                amount={inputMode === 'monthly' ? (item.monthlyAmount ?? 0) : item.annualAmount}
                onAmountChange={(annualAmount, monthlyAmount) =>
                  onItemAmountChange(item.id, annualAmount, monthlyAmount)
                }
              />
              {prevAmount != null && prevAmount > 0 && onApplySuggestion && (
                <div className="pl-11">
                  <PreviousYearSuggestion
                    categoryName={cat?.name ?? ''}
                    previousAmount={prevAmount}
                    onApply={(amount) => onApplySuggestion(item.id, amount)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
