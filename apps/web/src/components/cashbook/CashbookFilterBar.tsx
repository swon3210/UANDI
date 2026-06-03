'use client';

import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uandi/ui';
import type { EntrySort, PeriodSelection } from '@/hooks/useCashbook';

type CashbookFilterBarProps = {
  period: PeriodSelection;
  periodLabel: string;
  activeCount: number;
  canGoNext: boolean;
  sort: EntrySort;
  onSortChange: (sort: EntrySort) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpen: () => void;
};

export function CashbookFilterBar({
  period,
  periodLabel,
  activeCount,
  canGoNext,
  sort,
  onSortChange,
  onPrevMonth,
  onNextMonth,
  onOpen,
}: CashbookFilterBarProps) {
  const isMonthMode = period.mode === 'month';
  // month 모드에서는 연도를 상단 표시 전용 섹션으로 분리하고 스테퍼에는 '월'만 노출한다.
  // 좁은 화면에서 라벨이 차지하는 가로폭을 줄여 정렬/필터 컨트롤과의 줄바꿈 충돌을 방지한다.
  const yearLabel = period.mode === 'month' ? `${period.year}년` : null;
  const monthLabel = period.mode === 'month' ? `${period.month + 1}월` : periodLabel;

  return (
    <div data-testid="cashbook-filter-bar" className="flex flex-col gap-1.5">
      {yearLabel && (
        <span
          data-testid="cashbook-year-label"
          className="text-base font-semibold"
        >
          {yearLabel}
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        {isMonthMode ? (
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-testid="cashbook-prev-month"
              aria-label="이전 달"
              onClick={onPrevMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span
              data-testid="cashbook-period-label"
              className="min-w-[48px] text-center text-base font-semibold"
            >
              {monthLabel}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-testid="cashbook-next-month"
              aria-label="다음 달"
              onClick={onNextMonth}
              disabled={!canGoNext}
              className="h-8 w-8"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            data-testid="cashbook-period-label"
            onClick={onOpen}
            className="min-w-0 truncate text-left text-base font-semibold"
          >
            {periodLabel}
          </button>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          <Select value={sort} onValueChange={(v) => onSortChange(v as EntrySort)}>
            <SelectTrigger
              className="h-9 w-[116px]"
              aria-label="정렬"
              data-testid="cashbook-sort-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="oldest">오래된순</SelectItem>
              <SelectItem value="amountDesc">높은 금액순</SelectItem>
              <SelectItem value="amountAsc">낮은 금액순</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="cashbook-filter-trigger"
            aria-label="필터"
            onClick={onOpen}
            className="gap-1.5"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeCount > 0 && (
              <Badge
                data-testid="cashbook-filter-count"
                className="ml-0.5 h-5 min-w-5 justify-center px-1.5"
              >
                {activeCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
