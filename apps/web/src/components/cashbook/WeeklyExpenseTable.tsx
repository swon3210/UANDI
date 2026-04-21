'use client';

import { Badge } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';
import type { WeeklyExpense } from '@/hooks/useMonthlyBudget';

type WeeklyExpenseTableProps = {
  weeks: WeeklyExpense[];
};

function getWeekStatusEmoji(status: WeeklyExpense['status']): string {
  switch (status) {
    case 'stable':
      return '🟢';
    case 'warning':
      return '🟡';
    case 'danger':
      return '🔴';
    case 'future':
      return '⚪';
  }
}

export function WeeklyExpenseTable({ weeks }: WeeklyExpenseTableProps) {
  return (
    <div data-testid="weekly-expense-table" className="rounded-xl bg-card border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-secondary">
            <th className="py-2 px-3 text-left font-medium text-muted-foreground">주차</th>
            <th className="py-2 px-3 text-right font-medium text-muted-foreground">예산</th>
            <th className="py-2 px-3 text-right font-medium text-muted-foreground">실제</th>
            <th className="py-2 px-3 text-center font-medium text-muted-foreground">상태</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.week} className="border-t border-border">
              <td className="py-2.5 px-3 font-medium">{week.week}주차</td>
              <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                {formatCurrency(week.budget)}
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums">
                {week.status === 'future' ? '-' : formatCurrency(week.actual)}
              </td>
              <td className="py-2.5 px-3 text-center">
                <Badge variant="outline" className="text-xs">
                  {getWeekStatusEmoji(week.status)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
