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

export function BudgetDashboard({ coupleId }: Props) {
  const [period, setPeriod] = useState<PeriodKind>('monthly');
  const [group, setGroup] = useState<GroupFilter>('all');
  const [cursor, setCursor] = useState<Dayjs>(() => dayjs());

  const { trend, byCategory, total, hasEntries, isLoading } = useDashboardData({
    coupleId,
    period,
    group,
    cursor,
  });

  const handlePeriodChange = (next: PeriodKind) => {
    setPeriod(next);
    setCursor((prev) => normalizeCursor(next, prev));
  };

  const canGoNext = !isCurrentPeriod(period, cursor);
  const label = getPeriodLabel(period, cursor);
  const totalDisplay = group === 'all' ? total : Math.abs(total);

  return (
    <section className="space-y-3">
      <PeriodSelector value={period} onChange={handlePeriodChange} />
      <PeriodNavigator
        label={label}
        canGoNext={canGoNext}
        onPrev={() => setCursor((prev) => shiftPeriod(period, prev, -1))}
        onNext={() => canGoNext && setCursor((prev) => shiftPeriod(period, prev, 1))}
      />
      <GroupTabs value={group} onChange={setGroup} />

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
          <Skeleton className="h-[220px] w-full rounded-xl" />
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
          <div className="rounded-xl border border-border bg-card p-4">
            <BudgetTrendChart data={trend} group={group} />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <CategoryDonutChart data={byCategory} />
          </div>
        </>
      )}
    </section>
  );
}
