import { Button } from '@uandi/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@uandi/cashbook-core';
import type { MonthlySummary as MonthlySummaryType } from '@/hooks/useCashbook';

type MonthlySummaryProps = {
  year: number;
  month: number;
  summary: MonthlySummaryType;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function MonthlySummary({
  year,
  month,
  summary,
  onPrevMonth,
  onNextMonth,
}: MonthlySummaryProps) {
  return (
    <div className="p-3 border-b">
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" size="icon" onClick={onPrevMonth} className="h-7 w-7">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{`${year}년 ${month + 1}월`}</span>
        <Button variant="ghost" size="icon" onClick={onNextMonth} className="h-7 w-7">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="text-muted-foreground">수입</p>
          <p className="font-medium text-[hsl(var(--income))]">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">지출</p>
          <p className="font-medium text-destructive">
            {formatCurrency(summary.totalExpense)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">잔액</p>
          <p className="font-medium">{formatCurrency(summary.balance)}</p>
        </div>
      </div>
    </div>
  );
}
