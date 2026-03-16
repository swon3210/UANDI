'use client';

import { useCallback } from 'react';
import { formatCurrency } from '@/utils/currency';
import { PlanItemRow } from './PlanItemRow';
import type { AnnualPlanItem, CashbookCategory } from '@/types';
import { SUB_GROUP_LABELS } from '@/constants/default-categories';

type ExpensePlanTabProps = {
  items: AnnualPlanItem[];
  categories: CashbookCategory[];
  currentUserUid: string;
  partnerDisplayName?: string;
  onItemAmountChange: (itemId: string, annualAmount: number, monthlyAmount: number | null) => void;
  onTargetMonthsChange: (itemId: string, months: number[]) => void;
};

export function ExpensePlanTab({
  items,
  categories,
  currentUserUid,
  partnerDisplayName = '상대방',
  onItemAmountChange,
  onTargetMonthsChange,
}: ExpensePlanTabProps) {
  const fixedItems = items.filter((i) => i.subGroup === 'fixed_expense');
  const variableCommonItems = items.filter((i) => i.subGroup === 'variable_common');
  const variablePersonalItems = items.filter((i) => i.subGroup === 'variable_personal');

  const myItems = variablePersonalItems.filter((i) => i.ownerUid === currentUserUid);
  const partnerItems = variablePersonalItems.filter(
    (i) => i.ownerUid !== null && i.ownerUid !== currentUserUid
  );

  const getCategoryInfo = useCallback(
    (categoryId: string) => categories.find((c) => c.id === categoryId),
    [categories]
  );

  const total = items.reduce((sum, item) => sum + item.annualAmount, 0);

  // 고정 지출 중 targetMonths가 있는 항목은 target_months 모드
  const getInputMode = (item: AnnualPlanItem) => {
    if (item.targetMonths && item.targetMonths.length > 0) return 'target_months' as const;
    if (item.subGroup === 'fixed_expense') return 'monthly' as const;
    return 'monthly' as const;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          {SUB_GROUP_LABELS.fixed_expense}
        </h3>
        <div className="space-y-3">
          {fixedItems.map((item) => {
            const cat = getCategoryInfo(item.categoryId);
            const mode = getInputMode(item);
            return (
              <PlanItemRow
                key={item.id}
                categoryName={cat?.name ?? ''}
                categoryIcon={cat?.icon ?? ''}
                categoryColor={cat?.color ?? '#D8635A'}
                inputMode={mode}
                amount={mode === 'monthly' ? (item.monthlyAmount ?? 0) : item.annualAmount}
                targetMonths={item.targetMonths ?? undefined}
                onAmountChange={(annualAmount, monthlyAmount) =>
                  onItemAmountChange(item.id, annualAmount, monthlyAmount)
                }
                onTargetMonthsChange={(months) => onTargetMonthsChange(item.id, months)}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          {SUB_GROUP_LABELS.variable_common}
        </h3>
        <div className="space-y-3">
          {variableCommonItems.map((item) => {
            const cat = getCategoryInfo(item.categoryId);
            return (
              <PlanItemRow
                key={item.id}
                categoryName={cat?.name ?? ''}
                categoryIcon={cat?.icon ?? ''}
                categoryColor={cat?.color ?? '#D8635A'}
                inputMode="monthly"
                amount={item.monthlyAmount ?? 0}
                onAmountChange={(annualAmount, monthlyAmount) =>
                  onItemAmountChange(item.id, annualAmount, monthlyAmount)
                }
              />
            );
          })}
        </div>
      </div>

      {(myItems.length > 0 || partnerItems.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {SUB_GROUP_LABELS.variable_personal}
          </h3>

          {myItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground pl-1">👤 나의 지출</h4>
              <div className="space-y-3">
                {myItems.map((item) => {
                  const cat = getCategoryInfo(item.categoryId);
                  return (
                    <PlanItemRow
                      key={item.id}
                      categoryName={cat?.name ?? ''}
                      categoryIcon={cat?.icon ?? ''}
                      categoryColor={cat?.color ?? '#D8635A'}
                      inputMode="monthly"
                      amount={item.monthlyAmount ?? 0}
                      onAmountChange={(annualAmount, monthlyAmount) =>
                        onItemAmountChange(item.id, annualAmount, monthlyAmount)
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          {partnerItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground pl-1">
                👤 {partnerDisplayName}
              </h4>
              <div className="space-y-3">
                {partnerItems.map((item) => {
                  const cat = getCategoryInfo(item.categoryId);
                  return (
                    <PlanItemRow
                      key={item.id}
                      categoryName={cat?.name ?? ''}
                      categoryIcon={cat?.icon ?? ''}
                      categoryColor={cat?.color ?? '#D8635A'}
                      inputMode="monthly"
                      amount={item.monthlyAmount ?? 0}
                      onAmountChange={(annualAmount, monthlyAmount) =>
                        onItemAmountChange(item.id, annualAmount, monthlyAmount)
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className="rounded-xl bg-card border border-border p-3 flex items-center justify-between"
        data-testid="total-expense"
      >
        <span className="text-sm font-medium">총 연간 지출</span>
        <span className="text-base font-bold tabular-nums text-expense">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
