'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';
import type { DailyExpense } from '@/hooks/useWeeklyBudget';
import { CategoryIcon } from './CategoryIcon';

type DailyExpenseListProps = {
  days: DailyExpense[];
  categories?: { name: string; icon: string }[];
};

export function DailyExpenseList({ days, categories }: DailyExpenseListProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const catIconMap = new Map<string, string>();
  if (categories) {
    for (const c of categories) {
      catIconMap.set(c.name, c.icon);
    }
  }

  return (
    <div data-testid="daily-expense-list" className="space-y-1">
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">일별 지출</h3>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {days.map((day) => {
          const dateKey = day.date.format('YYYY-MM-DD');
          const isExpanded = expandedDate === dateKey;
          const hasEntries = day.entries.length > 0;

          return (
            <Collapsible
              key={dateKey}
              open={isExpanded}
              onOpenChange={(open) => setExpandedDate(open ? dateKey : null)}
            >
              <CollapsibleTrigger
                className={`flex items-center justify-between w-full px-3 py-2.5 text-sm border-b border-border last:border-b-0 transition-colors ${
                  day.isToday ? 'bg-accent' : ''
                } ${hasEntries && !day.isFuture ? 'cursor-pointer hover:bg-secondary' : ''}`}
                disabled={!hasEntries || day.isFuture}
                data-testid={`daily-row-${day.date.format('M/D')}`}
                data-future={day.isFuture ? 'true' : 'false'}
              >
                <div className="flex items-center gap-2">
                  {hasEntries && !day.isFuture ? (
                    isExpanded ? (
                      <ChevronDown size={14} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={14} className="text-muted-foreground" />
                    )
                  ) : (
                    <span className="w-3.5" />
                  )}
                  <span className={`font-medium ${day.isToday ? 'text-primary' : ''}`}>
                    {day.dayOfWeek} {day.date.format('M/D')}
                  </span>
                  {day.isToday && (
                    <span className="text-xs text-primary font-medium">오늘</span>
                  )}
                </div>
                <span className="tabular-nums font-medium">
                  {day.isFuture ? '-' : formatCurrency(day.total)}
                </span>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="bg-secondary/50 px-3 py-2 space-y-1.5 border-b border-border">
                  {day.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-sm pl-6"
                    >
                      <div className="flex items-center gap-2">
                        <CategoryIcon
                          name={catIconMap.get(entry.category) ?? 'circle'}
                          size={16}
                        />
                        <span className="text-muted-foreground">
                          {entry.category}
                          {entry.description && (
                            <span className="ml-1">· {entry.description}</span>
                          )}
                        </span>
                      </div>
                      <span className="tabular-nums">{formatCurrency(entry.amount)}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
