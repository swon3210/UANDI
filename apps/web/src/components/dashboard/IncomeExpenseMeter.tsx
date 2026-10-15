'use client';

import { cn } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';

export type MeterUpcoming = {
  /** 이달 남은 예정 고정 수입 합계 */
  income: number;
  /** 이달 남은 예정 고정 지출 합계 */
  expense: number;
};

type Props = {
  /** 기간 수입 합계 */
  income: number;
  /** 기간 지출 합계 */
  expense: number;
  /**
   * 이번 달일 때만: 아직 기록되지 않은 이달 예정 고정 수입·지출.
   * 게이지의 비율·막대는 실제 금액 그대로 두고, 예정 지출은 빗금 구간으로, 예정 반영 잔액은 아래 줄로 따로 보여준다.
   */
  upcoming?: MeterUpcoming | null;
};

// 예정 지출 구간은 실제 지출(채운 막대)과 구분되게 빗금으로 그린다.
const HATCH_STYLE = {
  backgroundImage:
    'repeating-linear-gradient(135deg, hsl(var(--expense) / 0.55) 0 4px, transparent 4px 8px)',
} as const;

/**
 * 전체 탭: 수입(트랙 = 100%) 중 얼마를 지출로 채웠는지, 넘기지는 않았는지 보여주는 게이지.
 * 수입을 넘기면 막대를 가득 채우고 초과 금액을 알린다.
 */
export function IncomeExpenseMeter({ income, expense, upcoming }: Props) {
  const hasIncome = income > 0;
  const ratio = hasIncome ? expense / income : expense > 0 ? Infinity : 0;
  const isOver = ratio > 1;
  const percent = hasIncome ? Math.round(ratio * 100) : null;
  const actualFraction = Math.min(ratio, 1);
  const fillWidth = `${actualFraction * 100}%`;

  const hasUpcoming = Boolean(upcoming && (upcoming.income > 0 || upcoming.expense > 0));
  // 빗금(예정 지출)은 실제 수입 트랙 위에서 남은 자리까지만 그린다. 수입이 없으면 트랙이 없어 생략.
  const upcomingFraction =
    hasIncome && upcoming && upcoming.expense > 0
      ? Math.min(upcoming.expense / income, 1 - actualFraction)
      : 0;
  const projectedIncome = income + (upcoming?.income ?? 0);
  const projectedExpense = expense + (upcoming?.expense ?? 0);
  const projectedRemaining = projectedIncome - projectedExpense;

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
        className="flex h-3 w-full overflow-hidden rounded-full bg-expense/15"
      >
        <div
          data-testid="meter-fill"
          className="h-full rounded-full bg-expense transition-[width]"
          style={{ width: fillWidth }}
        />
        {upcomingFraction > 0 ? (
          <div
            data-testid="meter-upcoming-fill"
            aria-hidden
            className="h-full transition-[width]"
            style={{ width: `${upcomingFraction * 100}%`, ...HATCH_STYLE }}
          />
        ) : null}
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

      {hasUpcoming && upcoming ? (
        <div
          data-testid="meter-projected"
          className="rounded-lg border border-dashed border-border px-3 py-2 text-xs"
        >
          <div className="flex items-center justify-between gap-2 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3 shrink-0 rounded-sm" style={HATCH_STYLE} />
              예정 고정 항목 반영 시
            </span>
            <span className="tabular-nums">
              {upcoming.income > 0 ? `수입 +${formatCurrency(upcoming.income)}` : null}
              {upcoming.income > 0 && upcoming.expense > 0 ? ' · ' : null}
              {upcoming.expense > 0 ? `지출 +${formatCurrency(upcoming.expense)}` : null}
            </span>
          </div>
          <div className="mt-1 text-sm font-semibold" data-testid="meter-projected-remaining">
            {projectedRemaining >= 0 ? (
              <span>
                <span className="text-muted-foreground">월말 예상 남은 금액 </span>
                <span className="font-extrabold tabular-nums text-income">
                  {formatCurrency(projectedRemaining)}
                </span>
              </span>
            ) : (
              <span>
                <span className="text-muted-foreground">월말엔 수입보다 </span>
                <span className="font-extrabold tabular-nums text-expense">
                  {formatCurrency(-projectedRemaining)}
                </span>
                <span className="text-muted-foreground"> 더 쓰게 돼요</span>
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
