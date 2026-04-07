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
    <div className="space-y-2">
      {/* 월 선택기 */}
      <div className="flex items-center justify-center gap-2 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrevMonth}>
          <ChevronLeft size={20} />
        </Button>
        <span className="text-base font-semibold min-w-[120px] text-center">
          {`${year}년 ${month + 1}월`}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNextMonth}>
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">수입</span>
          <span className="text-base font-semibold tabular-nums text-income">
            +{formatCurrency(summary.totalIncome)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">지출</span>
          <span className="text-base font-semibold tabular-nums text-expense">
            -{formatCurrency(summary.totalExpense)}
          </span>
        </div>
        <div className="border-t border-border pt-2 flex items-center justify-between">
          <span className="text-sm font-medium">잔액</span>
          <span className="text-base font-bold tabular-nums">
            {formatCurrency(summary.balance)}
          </span>
        </div>
      </div>
    </div>
  );
}
