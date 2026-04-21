'use client';

import { formatCurrency } from '@/utils/currency';
import type { WeeklyCategorySummary } from '@/hooks/useWeeklyBudget';
import { CategoryIcon } from './CategoryIcon';

type WeeklyCategoryBreakdownProps = {
  categories: WeeklyCategorySummary[];
};

export function WeeklyCategoryBreakdown({ categories }: WeeklyCategoryBreakdownProps) {
  if (categories.length === 0) return null;

  return (
    <div data-testid="weekly-category-breakdown" className="space-y-1">
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">카테고리별</h3>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {categories.map((cat) => (
          <div
            key={cat.categoryName}
            className="flex items-center justify-between px-3 py-2.5 text-sm border-b border-border last:border-b-0"
          >
            <div className="flex items-center gap-2">
              <CategoryIcon name={cat.icon} size={18} />
              <span className="font-medium">{cat.categoryName}</span>
            </div>
            <span className="tabular-nums font-medium">{formatCurrency(cat.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
