'use client';

import { ChevronRight } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';
import { ActualProjectedBar, HATCH_STYLE } from './ActualProjectedBar';

export type MeterUpcoming = {
  /** 이달 남은 예정 고정 수입 합계 */
  income: number;
  /** 이달 남은 예정 고정 지출 합계 */
  expense: number;
  /** 남은 예정 건수 (수입+지출) */
  count: number;
};

type Props = {
  /** 기간 수입 합계 */
  income: number;
  /** 기간 지출 합계 */
  expense: number;
  /**
   * 이번 달일 때만: 아직 기록되지 않은 이달 예정 고정 수입·지출.
   * 게이지의 비율은 실제 금액 그대로 두고, 수입·지출 막대에 예정 구간을 빗금으로 이어 그린다.
   */
  upcoming?: MeterUpcoming | null;
  /** 예정 칩 클릭 → 항목 목록 시트 */
  onUpcomingClick?: () => void;
};

/**
 * 전체 탭: 수입(트랙 = 100%) 중 얼마를 지출로 채웠는지, 넘기지는 않았는지 보여주는 게이지.
 * 수입을 넘기면 막대를 가득 채우고 초과 금액을 알린다.
 * 아래 수입·지출 막대는 같은 축에 두어 길이로 바로 비교되고, 예정 고정 항목은 빗금으로 이어진다.
 */
export function IncomeExpenseMeter({ income, expense, upcoming, onUpcomingClick }: Props) {
  const hasIncome = income > 0;
  const ratio = hasIncome ? expense / income : expense > 0 ? Infinity : 0;
  const isOver = ratio > 1;
  const percent = hasIncome ? Math.round(ratio * 100) : null;
  const fillWidth = `${Math.min(ratio, 1) * 100}%`;

  const upIncome = upcoming?.income ?? 0;
  const upExpense = upcoming?.expense ?? 0;
  const hasUpcoming = upIncome > 0 || upExpense > 0;
  const projectedIncome = income + upIncome;
  const projectedExpense = expense + upExpense;
  const projectedRemaining = projectedIncome - projectedExpense;
  const barMax = Math.max(projectedIncome, projectedExpense);

  return (
    <div data-testid="income-expense-meter" className="space-y-3">
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

      {/* 수입·지출을 같은 축에 둔 막대. 예정이 있으면 빗금으로 이어져 월말 모양이 보인다 */}
      <dl className="space-y-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
        <div>
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">수입</dt>
            <dd className="tabular-nums">
              <span data-testid="meter-income" className="text-sm font-semibold">
                {formatCurrency(income)}
              </span>
              {upIncome > 0 ? (
                <span data-testid="meter-income-upcoming" className="ml-1 text-income">
                  +{formatCurrency(upIncome)} 예정
                </span>
              ) : null}
            </dd>
          </div>
          <ActualProjectedBar
            actual={income}
            upcoming={upIncome}
            max={barMax}
            tone="income"
            testId="meter-income-bar"
            className="mt-1"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <dt className="text-muted-foreground">지출</dt>
            <dd className="tabular-nums">
              <span data-testid="meter-expense" className="text-sm font-semibold">
                {formatCurrency(expense)}
              </span>
              {upExpense > 0 ? (
                <span data-testid="meter-expense-upcoming" className="ml-1 text-expense">
                  +{formatCurrency(upExpense)} 예정
                </span>
              ) : null}
            </dd>
          </div>
          <ActualProjectedBar
            actual={expense}
            upcoming={upExpense}
            max={barMax}
            tone="expense"
            testId="meter-expense-bar"
            className="mt-1"
          />
        </div>
        {hasUpcoming ? (
          <div className="flex items-center justify-between gap-2 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-foreground/60" />
              실제
              <span className="ml-1 h-2 w-3 rounded-sm" style={HATCH_STYLE.expense} />
              예정
            </span>
            {onUpcomingClick ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUpcomingClick}
                data-testid="meter-upcoming-button"
                className="h-6 gap-0.5 px-1.5 text-xs"
              >
                예정 {upcoming?.count ?? 0}건
                <ChevronRight size={14} />
              </Button>
            ) : null}
          </div>
        ) : null}
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
        {hasUpcoming ? (
          <div className="mt-1 text-xs font-normal" data-testid="meter-projected-remaining">
            {projectedRemaining >= 0 ? (
              <span>
                <span className="text-muted-foreground">예정 반영 시 월말 남은 금액 </span>
                <span className="font-bold tabular-nums text-income">
                  {formatCurrency(projectedRemaining)}
                </span>
              </span>
            ) : (
              <span>
                <span className="text-muted-foreground">예정 반영 시 월말엔 수입보다 </span>
                <span className="font-bold tabular-nums text-expense">
                  {formatCurrency(-projectedRemaining)}
                </span>
                <span className="text-muted-foreground"> 더 쓰게 돼요</span>
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
