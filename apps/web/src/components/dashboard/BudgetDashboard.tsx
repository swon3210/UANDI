'use client';

import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { BookOpen } from 'lucide-react';
import { EmptyState, Skeleton } from '@uandi/ui';
import { useDashboardData, type GroupFilter } from '@/hooks/useDashboardData';
import {
  getPeriodLabel,
  isCurrentPeriod,
  normalizeCursor,
  shiftPeriod,
  type PeriodKind,
} from '@/utils/date';
import { PeriodSelector } from './PeriodSelector';
import { PeriodNavigator } from './PeriodNavigator';
import { GroupTabs } from './GroupTabs';
import { BudgetTrendChart } from './BudgetTrendChart';
import { CategoryDonutChart } from './CategoryDonutChart';
import { CategorySelector, type CategoryOption } from './CategorySelector';

type Props = {
  coupleId: string;
};

const TOTAL_LABEL: Record<GroupFilter, string> = {
  all: '순잔액',
  expense: '지출 합계',
  income: '수입 합계',
  flex: 'FLEX 합계',
  investment: '투자 합계',
};

const TOTAL_COLOR: Record<GroupFilter, string> = {
  all: 'text-foreground',
  expense: 'text-expense',
  income: 'text-income',
  flex: 'text-foreground',
  investment: 'text-foreground',
};

const MAX_TREND_CATEGORIES = 5;
const DEFAULT_TREND_TOP_N = 3;

export function BudgetDashboard({ coupleId }: Props) {
  const [period, setPeriod] = useState<PeriodKind>('monthly');
  const [group, setGroup] = useState<GroupFilter>('all');
  const [cursor, setCursor] = useState<Dayjs>(() => dayjs());
  // null = 자동(상위 N개), 배열 = 사용자가 직접 선택
  const [trendSelection, setTrendSelection] = useState<string[] | null>(null);

  const { trendByCategory, byCategory, total, hasEntries, isLoading } = useDashboardData({
    coupleId,
    period,
    group,
    cursor,
  });

  // period/group/cursor 변경 시 trend 선택을 자동으로 되돌리기 위한 헬퍼
  const resetTrendSelection = () => setTrendSelection(null);

  const handlePeriodChange = (next: PeriodKind) => {
    setPeriod(next);
    setCursor((prev) => normalizeCursor(next, prev));
    resetTrendSelection();
  };
  const handleGroupChange = (next: GroupFilter) => {
    setGroup(next);
    resetTrendSelection();
  };
  const handlePrev = () => {
    setCursor((prev) => shiftPeriod(period, prev, -1));
    resetTrendSelection();
  };
  const handleNext = () => {
    if (!isCurrentPeriod(period, cursor)) {
      setCursor((prev) => shiftPeriod(period, prev, 1));
      resetTrendSelection();
    }
  };

  const canGoNext = !isCurrentPeriod(period, cursor);
  const label = getPeriodLabel(period, cursor);
  const totalDisplay = group === 'all' ? total : Math.abs(total);

  // byCategory는 amount 내림차순으로 정렬된 상태 (useDashboardData 보장)
  const options: CategoryOption[] = byCategory.map((c) => ({
    name: c.category,
    color: c.color,
  }));
  const defaultSelection = options.slice(0, DEFAULT_TREND_TOP_N).map((o) => o.name);
  const effectiveSelected = trendSelection ?? defaultSelection;
  const selectedOptions: CategoryOption[] = effectiveSelected
    .map((name) => options.find((o) => o.name === name))
    .filter((o): o is CategoryOption => Boolean(o));

  const handleToggleCategory = (name: string) => {
    setTrendSelection((prev) => {
      const current = prev ?? defaultSelection;
      if (current.includes(name)) {
        return current.filter((n) => n !== name);
      }
      if (current.length >= MAX_TREND_CATEGORIES) return current;
      return [...current, name];
    });
  };

  return (
    <section className="space-y-3">
      <PeriodSelector value={period} onChange={handlePeriodChange} />
      <PeriodNavigator
        label={label}
        canGoNext={canGoNext}
        onPrev={handlePrev}
        onNext={handleNext}
      />
      <GroupTabs value={group} onChange={handleGroupChange} />

      <div
        data-testid="dashboard-total"
        className="rounded-xl border border-border bg-card px-4 py-3"
      >
        <div className="text-xs text-muted-foreground">{TOTAL_LABEL[group]}</div>
        <div
          className={`mt-1 text-2xl font-semibold tabular-nums ${TOTAL_COLOR[group]}`}
        >
          {totalDisplay.toLocaleString()}원
        </div>
      </div>

      {isLoading ? (
        <>
          <Skeleton className="h-[260px] w-full rounded-xl" />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </>
      ) : !hasEntries ? (
        <div
          data-testid="dashboard-empty"
          className="rounded-xl border border-border bg-card p-6"
        >
          <EmptyState
            icon={<BookOpen size={32} />}
            title="이 기간엔 내역이 없어요"
            description="다른 기간을 선택하거나 가계부에 내역을 추가해보세요"
          />
        </div>
      ) : (
        <>
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <CategorySelector
              options={options}
              selected={effectiveSelected}
              onToggle={handleToggleCategory}
              max={MAX_TREND_CATEGORIES}
            />
            <BudgetTrendChart
              data={trendByCategory}
              selectedCategories={selectedOptions}
            />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <CategoryDonutChart data={byCategory} />
          </div>
        </>
      )}
    </section>
  );
}
