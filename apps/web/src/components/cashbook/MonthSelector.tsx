'use client';

import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@uandi/ui';

type MonthSelectorProps = {
  selectedDate: Date;
  onChange: (date: Date) => void;
};

export function MonthSelector({ selectedDate, onChange }: MonthSelectorProps) {
  const current = dayjs(selectedDate);
  const isCurrentMonth = current.isSame(dayjs(), 'month');

  const goToPrev = () => onChange(current.subtract(1, 'month').toDate());
  const goToNext = () => {
    if (!isCurrentMonth) onChange(current.add(1, 'month').toDate());
  };

  return (
    <div className="flex items-center justify-center gap-2 py-3" data-testid="month-selector">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrev}>
        <ChevronLeft size={20} />
      </Button>
      <span className="text-base font-semibold min-w-[120px] text-center">
        {current.format('YYYY년 M월')}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={goToNext}
        disabled={isCurrentMonth}
      >
        <ChevronRight size={20} />
      </Button>
    </div>
  );
}
