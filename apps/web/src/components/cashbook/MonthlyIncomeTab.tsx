'use client';

import { Button, Badge, Separator } from '@uandi/ui';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import type { MonthlyBudgetItem } from '@/types';
import type { CashbookEntry } from '@/types';
import { CategoryIcon } from './CategoryIcon';

type MonthlyIncomeTabProps = {
  budgetItems: MonthlyBudgetItem[];
  entries: CashbookEntry[];
  categories: { id: string; name: string; icon: string; subGroup: string }[];
  onAddIrregularIncome: () => void;
};

export function MonthlyIncomeTab({
  budgetItems,
  entries,
  categories,
  onAddIrregularIncome,
}: MonthlyIncomeTabProps) {
  const incomeBudgets = budgetItems.filter((b) => b.group === 'income');
  const regularBudgets = incomeBudgets.filter((b) => b.subGroup === 'regular_income');
  const irregularBudgets = incomeBudgets.filter((b) => b.subGroup === 'irregular_income');

  const incomeEntries = entries.filter((e) => e.type === 'income');

  // 카테고리 이름으로 실제 입력 여부 확인
  const actualByCategory = new Map<string, number>();
  for (const entry of incomeEntries) {
    actualByCategory.set(entry.category, (actualByCategory.get(entry.category) ?? 0) + entry.amount);
  }

  const planTotal = incomeBudgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const actualTotal = incomeEntries.reduce((sum, e) => sum + e.amount, 0);
  const achieveRate = planTotal > 0 ? Math.round((actualTotal / planTotal) * 100) : 0;

  return (
    <div className="space-y-6" data-testid="income-tab-content">
      {/* 정기 수입 */}
      <section>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">정기 수입</h4>
        <div className="rounded-xl border border-border divide-y divide-border">
          {regularBudgets.length > 0 ? (
            regularBudgets.map((b) => {
              const cat = categories.find((c) => c.id === b.categoryId);
              const catName = cat?.name ?? '기타';
              const actual = actualByCategory.get(catName) ?? 0;
              const isReflected = actual > 0;

              return (
                <div key={b.categoryId} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <CategoryIcon name={cat?.icon ?? 'wallet'} size={18} />
                    <span className="text-sm font-medium">{catName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums font-semibold">
                      {isReflected ? formatCurrency(actual) : formatCurrency(b.budgetAmount)}
                    </span>
                    <Badge variant={isReflected ? 'default' : 'outline'} className="text-xs">
                      {isReflected ? '반영됨' : '예정'}
                    </Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="p-4 text-sm text-muted-foreground text-center">
              정기 수입이 설정되지 않았어요
            </p>
          )}
        </div>
      </section>

      {/* 비정기 수입 */}
      <section>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">비정기 수입</h4>
        <div className="rounded-xl border border-border divide-y divide-border">
          {irregularBudgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const catName = cat?.name ?? '기타';
            const actual = actualByCategory.get(catName) ?? 0;

            return (
              <div key={b.categoryId} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <CategoryIcon name={cat?.icon ?? 'question'} size={18} />
                  <span className="text-sm font-medium">{catName}</span>
                </div>
                <span className="text-sm tabular-nums font-semibold">
                  {actual > 0 ? formatCurrency(actual) : '-'}
                </span>
              </div>
            );
          })}
          {/* 비정기 수입 중 카테고리 매칭 안되는 실제 입력도 표시 */}
          {incomeEntries
            .filter((e) => {
              const isBudgeted = incomeBudgets.some((b) => {
                const cat = categories.find((c) => c.id === b.categoryId);
                return cat?.name === e.category;
              });
              return !isBudgeted;
            })
            .map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3">
                <span className="text-sm font-medium">{e.category}</span>
                <span className="text-sm tabular-nums font-semibold">
                  {formatCurrency(e.amount)}
                </span>
              </div>
            ))}
          <div className="p-3">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={onAddIrregularIncome}
            >
              <Plus size={16} className="mr-1" />
              비정기 수입 추가
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* 수입 요약 */}
      <div className="rounded-xl border border-border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">계획</span>
          <span className="text-sm tabular-nums font-semibold">{formatCurrency(planTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">실제</span>
          <span className="text-sm tabular-nums font-semibold text-income">
            {formatCurrency(actualTotal)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm font-medium">달성률</span>
          <span className="text-sm font-bold">{achieveRate}%</span>
        </div>
      </div>
    </div>
  );
}
