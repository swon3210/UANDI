'use client';

import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@uandi/ui';
import type { PeriodKind } from '@/utils/date';

type Props = {
  kind: PeriodKind;
  /** 현재 선택된 기간의 커서 (처음 보여줄 페이지 기준) */
  value: Dayjs;
  /** false면 value를 선택 표시하지 않는다 (다른 비교 대상이 선택된 경우). 기본 true */
  highlightValue?: boolean;
  /** 미래 기간 비활성화 기준. 스토리 등에서 고정값 주입용 */
  today?: Dayjs;
  onSelect: (cursor: Dayjs) => void;
};

const YEARS_PER_PAGE = 12;

export function PeriodPicker({
  kind,
  value,
  highlightValue = true,
  today = dayjs(),
  onSelect,
}: Props) {
  const props = { value, highlightValue, today, onSelect };
  if (kind === 'monthly') return <MonthPicker {...props} />;
  return <YearPicker {...props} />;
}

type PickerProps = Omit<Props, 'kind' | 'today' | 'highlightValue'> & {
  today: Dayjs;
  highlightValue: boolean;
};

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

function MonthPicker({ value, highlightValue, today, onSelect }: PickerProps) {
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
          const selected = highlightValue && m.isSame(value, 'month');
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

function YearPicker({ value, highlightValue, today, onSelect }: PickerProps) {
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
          const selected = highlightValue && year === value.year();
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
