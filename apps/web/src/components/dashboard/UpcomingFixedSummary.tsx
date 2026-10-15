'use client';

import { CalendarClock, ChevronRight } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import type { CategoryGroup } from '@/types';
import { formatCurrency } from '@/utils/currency';
import type { UpcomingFixedTotals } from '@/utils/upcoming-fixed';

type Props = {
  /** 어느 그룹의 예정을 보여줄지. all이면 수입·지출을 각각 한 줄씩 */
  group: 'all' | CategoryGroup;
  expense: UpcomingFixedTotals;
  income: UpcomingFixedTotals;
  /** 발생일이 지났는데 아직 기록하지 않은 건수 (합계엔 안 들어가고 안내만) */
  overdueCount: number;
  /** 지출·수입 탭: 지금까지의 실제 합계. 넘기면 '월말 예상 합계'(실제 + 예정)를 함께 보여준다 */
  actualTotal?: number;
  onClick: () => void;
};

const TITLE: Record<Props['group'], string> = {
  all: '이달 예정 고정 수입·지출',
  expense: '이달 예정 고정 지출',
  income: '이달 예정 고정 수입',
};

const ROW_LABEL: Record<CategoryGroup, string> = {
  expense: '예정 고정 지출',
  income: '예정 고정 수입',
};

const AMOUNT_COLOR: Record<CategoryGroup, string> = {
  expense: 'text-expense',
  income: 'text-income',
};

/**
 * 월간 탭(이번 달)에서 합계 카드 아래에 붙는 보조 카드.
 * 큰 숫자(실제 합계)는 건드리지 않고, 아직 안 빠져나간 고정 지출·안 들어온 고정 수입을
 * 건수·금액으로 따로 보여준다. 누르면 항목 목록 시트가 열린다.
 */
export function UpcomingFixedSummary({
  group,
  expense,
  income,
  overdueCount,
  actualTotal,
  onClick,
}: Props) {
  const rows: CategoryGroup[] = group === 'all' ? ['income', 'expense'] : [group];
  const visibleRows = rows.filter((g) => (g === 'expense' ? expense : income).count > 0);
  const hasUpcoming = visibleRows.length > 0;
  if (!hasUpcoming && overdueCount === 0) return null;

  const totalsOf = (g: CategoryGroup) => (g === 'expense' ? expense : income);
  const showProjected = group !== 'all' && actualTotal !== undefined && hasUpcoming;

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      data-testid="upcoming-fixed-summary"
      className="block h-auto w-full whitespace-normal rounded-xl border border-dashed border-border bg-card px-4 py-3 text-left font-normal hover:bg-accent/40"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarClock size={14} aria-hidden />
          {TITLE[group]}
        </span>
        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
          자세히
          <ChevronRight size={14} />
        </span>
      </div>

      <dl className="mt-2 space-y-1">
        {visibleRows.map((g) => {
          const t = totalsOf(g);
          return (
            <div key={g} className="flex items-baseline justify-between gap-2">
              <dt className="text-sm text-muted-foreground" data-testid={`upcoming-${g}-count`}>
                {ROW_LABEL[g]} {t.count}건
              </dt>
              <dd
                className={cn('text-sm font-semibold tabular-nums', AMOUNT_COLOR[g])}
                data-testid={`upcoming-${g}-amount`}
              >
                {formatCurrency(t.amount)}
              </dd>
            </div>
          );
        })}
        {!hasUpcoming ? (
          <div className="text-sm text-muted-foreground">남은 예정은 없어요</div>
        ) : null}
        {showProjected ? (
          <div className="flex items-baseline justify-between gap-2 border-t border-border pt-1.5">
            <dt className="text-sm text-muted-foreground">월말 예상 합계</dt>
            <dd
              className="text-base font-semibold tabular-nums"
              data-testid="upcoming-projected-total"
            >
              {formatCurrency((actualTotal ?? 0) + totalsOf(group as CategoryGroup).amount)}
            </dd>
          </div>
        ) : null}
      </dl>

      {overdueCount > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground" data-testid="upcoming-overdue-hint">
          ⏰ 발생일이 지났는데 아직 기록하지 않은 항목 {overdueCount}건
        </p>
      ) : null}
    </Button>
  );
}
