'use client';

import { ChevronRight } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import { formatCurrency, formatCurrencyMan } from '@/utils/currency';
import { ActualProjectedBar } from './ActualProjectedBar';

export type MeterUpcoming = {
  /** 이달 남은 예정 고정 수입 합계 */
  income: number;
  /** 이달 남은 예정 고정 지출 합계 */
  expense: number;
  /** 남은 예정 건수 (수입+지출) */
  count: number;
  /** 발생일이 지났는데 아직 기록하지 않은 건수 */
  overdueCount?: number;
};

type Props = {
  /** 기간 수입 합계 */
  income: number;
  /** 기간 지출 합계 */
  expense: number;
  /**
   * 이번 달일 때만: 아직 기록되지 않은 이달 예정 고정 수입·지출.
   * 예정이 있으면 "월말 예상 남은 금액"을 머리기사로 두는 투영 레이아웃으로 바뀐다.
   */
  upcoming?: MeterUpcoming | null;
  /** 예정 칩 클릭 → 항목 목록 시트 */
  onUpcomingClick?: () => void;
  /** 예정의 지평. 월간 탭은 월말, 연간 탭은 연말. 머리기사 문구에만 쓴다 */
  horizon?: 'month' | 'year';
};

const HORIZON_LABEL: Record<'month' | 'year', string> = { month: '월말', year: '연말' };

/**
 * 전체 탭: 수입 대비 지출.
 * - 기록이 끝난 기간(예정 없음): 수입(트랙 = 100%) 중 얼마를 지출로 채웠는지 게이지 + 남은 금액.
 * - 이번 달(예정 있음): 달 중간의 비율은 월급 전이면 의미가 없으므로, 예정을 더한 월말 예상
 *   남은 금액 하나만 크게 두고 수입·지출 막대(실제 단색 + 예정 빗금)로 모양을 보여준다.
 */
export function IncomeExpenseMeter({
  income,
  expense,
  upcoming,
  onUpcomingClick,
  horizon = 'month',
}: Props) {
  const upIncome = upcoming?.income ?? 0;
  const upExpense = upcoming?.expense ?? 0;
  const hasUpcoming = upIncome > 0 || upExpense > 0;

  if (hasUpcoming && upcoming) {
    return (
      <ProjectedMeter
        income={income}
        expense={expense}
        upcoming={upcoming}
        onUpcomingClick={onUpcomingClick}
        horizon={horizon}
      />
    );
  }
  return <ActualMeter income={income} expense={expense} />;
}

function ProjectedMeter({
  income,
  expense,
  upcoming,
  onUpcomingClick,
  horizon,
}: {
  income: number;
  expense: number;
  upcoming: MeterUpcoming;
  onUpcomingClick?: () => void;
  horizon: 'month' | 'year';
}) {
  const projectedIncome = income + upcoming.income;
  const projectedExpense = expense + upcoming.expense;
  const remaining = projectedIncome - projectedExpense;
  const barMax = Math.max(projectedIncome, projectedExpense);
  const overdueCount = upcoming.overdueCount ?? 0;

  return (
    <div data-testid="income-expense-meter" data-mode="projected" className="space-y-3">
      <div>
        <div className="text-xs text-muted-foreground">
          {HORIZON_LABEL[horizon]} 예상 {remaining >= 0 ? '남은' : '부족'} 금액
        </div>
        <div
          data-testid="meter-projected-remaining"
          className={cn(
            'mt-1 text-2xl font-semibold tabular-nums',
            remaining >= 0 ? 'text-income' : 'text-expense'
          )}
        >
          {formatCurrency(Math.abs(remaining))}
        </div>
      </div>

      {/* 수입·지출을 같은 축에 둔 막대. 단색 = 실제, 빗금 = 예정. 숫자는 줄 끝에 월말 예상 하나 */}
      <dl className="space-y-2.5">
        <div className="flex items-center gap-3">
          <dt className="w-7 shrink-0 text-xs text-muted-foreground">수입</dt>
          <ActualProjectedBar
            actual={income}
            upcoming={upcoming.income}
            max={barMax}
            tone="income"
            testId="meter-income-bar"
            className="flex-1"
          />
          <dd
            data-testid="meter-income-projected"
            className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums"
          >
            {formatCurrencyMan(projectedIncome)}
          </dd>
        </div>
        <div className="flex items-center gap-3">
          <dt className="w-7 shrink-0 text-xs text-muted-foreground">지출</dt>
          <ActualProjectedBar
            actual={expense}
            upcoming={upcoming.expense}
            max={barMax}
            tone="expense"
            testId="meter-expense-bar"
            className="flex-1"
          />
          <dd
            data-testid="meter-expense-projected"
            className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums"
          >
            {formatCurrencyMan(projectedExpense)}
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span data-testid="meter-actual-line" className="tabular-nums">
          지금까지 수입{' '}
          <span data-testid="meter-income" className="font-medium text-foreground">
            {formatCurrencyMan(income)}
          </span>
          {' · '}지출{' '}
          <span data-testid="meter-expense" className="font-medium text-foreground">
            {formatCurrencyMan(expense)}
          </span>
        </span>
        {onUpcomingClick ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUpcomingClick}
            data-testid="meter-upcoming-button"
            className="h-6 shrink-0 gap-0.5 px-1.5 text-xs"
          >
            예정 {upcoming.count}건{overdueCount > 0 ? ` · 미기록 ${overdueCount}건` : ''}
            <ChevronRight size={14} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ActualMeter({ income, expense }: { income: number; expense: number }) {
  const hasIncome = income > 0;
  const ratio = hasIncome ? expense / income : expense > 0 ? Infinity : 0;
  const isOver = ratio > 1;
  const percent = hasIncome ? Math.round(ratio * 100) : null;
  const fillWidth = `${Math.min(ratio, 1) * 100}%`;

  return (
    <div data-testid="income-expense-meter" data-mode="actual" className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <span className="text-xs text-muted-foreground">수입 대비 지출</span>
        <span
          data-testid="meter-percent"
          className={cn('text-2xl font-semibold', isOver ? 'text-expense' : 'text-foreground')}
        >
          {percent !== null ? `${percent}%` : '—'}
        </span>
      </div>

      <div
        role="meter"
        aria-label="수입 대비 지출"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? 100}
        aria-valuetext={percent !== null ? `수입의 ${percent}% 지출` : '수입 없음'}
        className="h-3 w-full overflow-hidden rounded-full bg-expense/15"
      >
        <div
          data-testid="meter-fill"
          className="h-full rounded-full bg-expense transition-[width]"
          style={{ width: fillWidth }}
        />
      </div>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full bg-expense/25" />
            수입
          </dt>
          <dd data-testid="meter-income" className="mt-0.5 text-sm font-semibold tabular-nums">
            {formatCurrency(income)}
          </dd>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full bg-expense" />
            지출
          </dt>
          <dd data-testid="meter-expense" className="mt-0.5 text-sm font-semibold tabular-nums">
            {formatCurrency(expense)}
          </dd>
        </div>
      </dl>

      <div
        data-testid="meter-status"
        className="rounded-lg bg-muted/50 px-3 py-2 text-sm font-semibold"
      >
        {!hasIncome ? (
          expense > 0 ? (
            <span className="text-expense">🚨 이 기간엔 수입이 없어요</span>
          ) : (
            <span className="text-muted-foreground">이 기간엔 수입·지출 내역이 없어요</span>
          )
        ) : isOver ? (
          <span>
            🚨 <span className="text-muted-foreground">수입보다 </span>
            <span className="font-extrabold tabular-nums text-expense">
              {formatCurrency(expense - income)}
            </span>
            <span className="text-muted-foreground"> 더 썼어요</span>
          </span>
        ) : (
          <span>
            😎 <span className="text-muted-foreground">남은 금액 </span>
            <span className="font-extrabold tabular-nums text-income">
              {formatCurrency(income - expense)}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
