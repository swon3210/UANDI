'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@uandi/ui';
import type { WeekInfo } from '@/hooks/useWeeklyBudget';

type WeekSelectorProps = {
  month: number; // 1~12
  weekInfo: WeekInfo;
  onPrev: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
};

export function WeekSelector({
  month,
  weekInfo,
  onPrev,
  onNext,
  isNextDisabled = false,
}: WeekSelectorProps) {
  const startLabel = weekInfo.start.format('M/D(dd)');
  const endLabel = weekInfo.end.format('M/D(dd)');

  return (
    <div className="flex flex-col items-center gap-1 py-3" data-testid="week-selector">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev}>
          <ChevronLeft size={20} />
        </Button>
        <span className="text-base font-semibold min-w-[140px] text-center">
          {month}월 {weekInfo.week}주차
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onNext}
          disabled={isNextDisabled}
        >
          <ChevronRight size={20} />
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">
        {startLabel} ~ {endLabel}
      </span>
    </div>
  );
}
