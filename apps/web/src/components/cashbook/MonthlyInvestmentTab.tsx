'use client';

import { Button, Separator } from '@uandi/ui';
import { Plus } from 'lucide-react';
import dayjs from 'dayjs';
import { formatCurrency } from '@/utils/currency';
import type { CashbookEntry, CashBalance, MonthlyBudgetItem } from '@/types';
import { CategoryIcon } from './CategoryIcon';

type MonthlyInvestmentTabProps = {
  budgetItems: MonthlyBudgetItem[];
  entries: CashbookEntry[];
  cashBalances: CashBalance[];
  categories: { id: string; name: string; icon: string; subGroup: string }[];
  onAddInvestment: () => void;
  onUpdateBalance: () => void;
};

export function MonthlyInvestmentTab({
  budgetItems,
  entries,
  cashBalances,
  categories,
  onAddInvestment,
  onUpdateBalance,
}: MonthlyInvestmentTabProps) {
  const investmentBudgets = budgetItems.filter((b) => b.group === 'investment');
  const planTotal = investmentBudgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const investmentEntries = entries.filter((e) => e.type === 'investment');
  const actualTotal = investmentEntries.reduce((sum, e) => sum + e.amount, 0);

  // 투자 내역을 카테고리별로 그룹
  const entriesByCategory = new Map<string, CashbookEntry[]>();
  for (const entry of investmentEntries) {
    const list = entriesByCategory.get(entry.category) ?? [];
    list.push(entry);
    entriesByCategory.set(entry.category, list);
  }

  // 현금 보유 카테고리
  const cashHoldingCategories = categories.filter((c) => c.subGroup === 'cash_holding');

  return (
    <div className="space-y-6" data-testid="investment-tab-content">
      {/* 월별 재테크 현황 */}
      <section>
        <div className="rounded-xl border border-border p-4 space-y-2">
          <h4 className="text-sm font-semibold">이번 달 재테크</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">계획</span>
            <span className="text-sm tabular-nums font-semibold">{formatCurrency(planTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">실제</span>
            <span className="text-sm tabular-nums font-semibold">
              {formatCurrency(actualTotal)}
            </span>
          </div>
        </div>
      </section>

      {/* 투자 내역 */}
      <section>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">투자 내역</h4>
        <div className="rounded-xl border border-border divide-y divide-border">
          {Array.from(entriesByCategory.entries()).map(([catName, catEntries]) => {
            const cat = categories.find((c) => c.name === catName);
            return (
              <div key={catName} className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CategoryIcon name={cat?.icon ?? 'chart_line_up'} size={18} />
                  <span className="text-sm font-semibold">{catName}</span>
                </div>
                {catEntries
                  .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime())
                  .map((entry) => {
                    const txType = (entry as CashbookEntry & { transactionType?: string })
                      .transactionType;
                    const isSell = txType === 'sell';
                    return (
                      <div key={entry.id} className="flex items-center justify-between pl-6">
                        <span className="text-xs text-muted-foreground">
                          {dayjs(entry.date.toDate()).format('M/D')}
                          {txType && <span className="ml-1.5">{isSell ? '매도' : '매수'}</span>}
                        </span>
                        <span
                          className={`text-sm tabular-nums font-medium ${isSell ? 'text-income' : ''}`}
                        >
                          {isSell ? '+' : ''}
                          {formatCurrency(entry.amount)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            );
          })}
          {entriesByCategory.size === 0 && (
            <p className="p-4 text-sm text-muted-foreground text-center">
              이번 달 투자 내역이 없어요
            </p>
          )}
          <div className="p-3">
            <Button variant="ghost" className="w-full text-sm" onClick={onAddInvestment}>
              <Plus size={16} className="mr-1" />
              투자 내역 추가
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* 현금 보유 */}
      <section>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">현금 보유</h4>
        <div className="rounded-xl border border-border divide-y divide-border">
          {cashHoldingCategories.map((cat) => {
            const balance = cashBalances.find((b) => b.categoryId === cat.id);
            return (
              <div key={cat.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <CategoryIcon name={cat.icon} size={18} />
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                <span className="text-sm tabular-nums font-semibold">
                  {balance ? formatCurrency(balance.balance) : '-'}
                </span>
              </div>
            );
          })}
          <div className="p-3">
            <Button variant="ghost" className="w-full text-sm" onClick={onUpdateBalance}>
              잔고 업데이트
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
