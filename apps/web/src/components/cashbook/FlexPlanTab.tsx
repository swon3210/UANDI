'use client';

import { useCallback } from 'react';
import { Separator } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';
import { PlanItemRow } from './PlanItemRow';
import type { AnnualPlanItem, CashbookCategory } from '@/types';
import { SUB_GROUP_LABELS } from '@/constants/default-categories';

type FlexPlanTabProps = {
  items: AnnualPlanItem[];
  categories: CashbookCategory[];
  /** 재테크 미배분 + 기본 잔여 금액 */
  flexAvailable: number;
  currentUserUid: string;
  partnerDisplayName?: string;
  onItemAmountChange: (itemId: string, annualAmount: number, monthlyAmount: number | null) => void;
};

export function FlexPlanTab({
  items,
  categories,
  flexAvailable,
  currentUserUid,
  partnerDisplayName = '상대방',
  onItemAmountChange,
}: FlexPlanTabProps) {
  const jointItems = items.filter((i) => i.subGroup === 'joint_flex');
  const personalItems = items.filter((i) => i.subGroup === 'personal_flex');

  const myItems = personalItems.filter((i) => i.ownerUid === currentUserUid);
  const partnerItems = personalItems.filter(
    (i) => i.ownerUid !== null && i.ownerUid !== currentUserUid
  );

  const getCategoryInfo = useCallback(
    (categoryId: string) => categories.find((c) => c.id === categoryId),
    [categories]
  );

  const flexTotal = items.reduce((sum, item) => sum + item.annualAmount, 0);
  const flexUnallocated = flexAvailable - flexTotal;

  return (
    <div className="space-y-6">
      {/* Flex 가용 금액 */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-2">
        <h3 className="text-sm font-medium">Flex 가용 금액</h3>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">미배분 잔액</span>
          <span className="font-medium tabular-nums" data-testid="flex-available">
            {formatCurrency(flexAvailable)}
          </span>
        </div>
      </div>

      {/* 공동 Flex */}
      {jointItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {SUB_GROUP_LABELS.joint_flex}
          </h3>
          <div className="space-y-3">
            {jointItems.map((item) => {
              const cat = getCategoryInfo(item.categoryId);
              return (
                <PlanItemRow
                  key={item.id}
                  categoryName={cat?.name ?? ''}
                  categoryIcon={cat?.icon ?? ''}
                  categoryColor={cat?.color ?? '#F0A05E'}
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

      {/* 각자 Flex */}
      {(myItems.length > 0 || partnerItems.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {SUB_GROUP_LABELS.personal_flex}
          </h3>

          {myItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground pl-1">👤 나</h4>
              <div className="space-y-3">
                {myItems.map((item) => {
                  const cat = getCategoryInfo(item.categoryId);
                  return (
                    <PlanItemRow
                      key={item.id}
                      categoryName={cat?.name ?? ''}
                      categoryIcon={cat?.icon ?? ''}
                      categoryColor={cat?.color ?? '#F0A05E'}
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
                      categoryColor={cat?.color ?? '#F0A05E'}
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
        </div>
      )}

      {/* 합계 */}
      <div className="rounded-xl bg-card border border-border p-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span>Flex 배분 합계</span>
          <span className="font-semibold tabular-nums" data-testid="flex-total">
            {formatCurrency(flexTotal)}
          </span>
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">미배분</span>
          <span className="tabular-nums">{formatCurrency(flexUnallocated)}</span>
        </div>
      </div>
    </div>
  );
}
