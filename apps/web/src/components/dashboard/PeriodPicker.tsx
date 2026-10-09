'use client';

import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import type { PeriodKind } from '@/utils/date';

type Props = {
  kind: PeriodKind;
  /** 현재 선택된 기간의 커서 */
  value: Dayjs;
  /** 미래 기간 비활성화 기준. 스토리 등에서 고정값 주입용 */
  today?: Dayjs;
  onSelect: (cursor: Dayjs) => void;
};

const YEARS_PER_PAGE = 12;

export function PeriodPicker({ kind, value, today = dayjs(), onSelect }: Props) {
  if (kind === 'weekly') return <WeekPicker value={value} today={today} onSelect={onSelect} />;
  if (kind === 'monthly') return <MonthPicker value={value} today={today} onSelect={onSelect} />;
  return <YearPicker value={value} today={today} onSelect={onSelect} />;
}

type PickerProps = Omit<Props, 'kind' | 'today'> & { today: Dayjs };

function PickerNav({
  title,
  canGoNext,
  onPrev,
  onNext,
}: {
  title: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        data-testid="period-picker-prev"
        aria-label="이전"
      >
        <ChevronLeft size={18} />
      </Button>
      <span data-testid="period-picker-title" className="text-sm font-semibold">
        {title}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!canGoNext}
        data-testid="period-picker-next"
        aria-label="다음"
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}

function WeekPicker({ value, today, onSelect }: PickerProps) {
  const [viewMonth, setViewMonth] = useState(() => value.startOf('month'));

  const gridStart = viewMonth.startOf('week');
  const gridEnd = viewMonth.endOf('month').endOf('week');
  const dayCount = gridEnd.diff(gridStart, 'day') + 1;
  const days = Array.from({ length: dayCount }, (_, i) => gridStart.add(i, 'day'));
  const weekdays = days.slice(0, 7).map((d) => d.format('dd'));

  return (
    <div className="space-y-2">
      <PickerNav
        title={viewMonth.format('YYYY년 M월')}
        canGoNext={viewMonth.isBefore(today, 'month')}
        onPrev={() => setViewMonth((m) => m.subtract(1, 'month'))}
        onNext={() => setViewMonth((m) => m.add(1, 'month'))}
      />
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {weekdays.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((d) => {
          const inSelectedWeek = d.isSame(value, 'week');
          const isOutside = !d.isSame(viewMonth, 'month');
          return (
            <Button
              key={d.valueOf()}
              variant="ghost"
              disabled={d.isAfter(today, 'day')}
              onClick={() => onSelect(d.startOf('week'))}
              data-testid={`period-picker-day-${d.format('YYYY-MM-DD')}`}
              aria-pressed={inSelectedWeek}
              className={cn(
                'h-10 rounded-none p-0 text-sm tabular-nums',
                isOutside && 'text-muted-foreground/60',
                inSelectedWeek && 'bg-primary/15 text-primary hover:bg-primary/20',
                inSelectedWeek && d.day() === gridStart.day() && 'rounded-l-lg',
                inSelectedWeek && d.day() === gridEnd.day() && 'rounded-r-lg',
                d.isSame(today, 'day') && 'font-bold underline underline-offset-4'
              )}
            >
              {d.date()}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function MonthPicker({ value, today, onSelect }: PickerProps) {
  const [viewYear, setViewYear] = useState(() => value.startOf('year'));

  return (
    <div className="space-y-3">
      <PickerNav
        title={viewYear.format('YYYY년')}
        canGoNext={viewYear.isBefore(today, 'year')}
        onPrev={() => setViewYear((y) => y.subtract(1, 'year'))}
        onNext={() => setViewYear((y) => y.add(1, 'year'))}
      />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, i) => {
          const m = viewYear.month(i);
          const selected = m.isSame(value, 'month');
          return (
            <Button
              key={i}
              variant={selected ? 'default' : 'ghost'}
              disabled={m.isAfter(today, 'month')}
              onClick={() => onSelect(m)}
              data-testid={`period-picker-month-${i + 1}`}
              aria-pressed={selected}
              className="h-12"
            >
              {i + 1}월
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function YearPicker({ value, today, onSelect }: PickerProps) {
  // 선택된 연도가 들어 있는 페이지에서 시작. 페이지 끝은 올해 기준으로 정렬한다.
  const [pageEnd, setPageEnd] = useState(() => {
    const offset = Math.floor((today.year() - value.year()) / YEARS_PER_PAGE);
    return today.year() - offset * YEARS_PER_PAGE;
  });
  const pageStart = pageEnd - YEARS_PER_PAGE + 1;

  return (
    <div className="space-y-3">
      <PickerNav
        title={`${pageStart} ~ ${pageEnd}`}
        canGoNext={pageEnd < today.year()}
        onPrev={() => setPageEnd((y) => y - YEARS_PER_PAGE)}
        onNext={() => setPageEnd((y) => y + YEARS_PER_PAGE)}
      />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
          const year = pageStart + i;
          const selected = year === value.year();
          return (
            <Button
              key={year}
              variant={selected ? 'default' : 'ghost'}
              onClick={() => onSelect(value.year(year).startOf('year'))}
              data-testid={`period-picker-year-${year}`}
              aria-pressed={selected}
              className="h-12 tabular-nums"
            >
              {year}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
