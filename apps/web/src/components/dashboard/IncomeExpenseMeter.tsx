'use client';

import { cn } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';

type Props = {
  /** 기간 수입 합계 */
  income: number;
  /** 기간 지출 합계 */
  expense: number;
};

/**
 * 전체 탭: 수입(트랙 = 100%) 중 얼마를 지출로 채웠는지, 넘기지는 않았는지 보여주는 게이지.
 * 수입을 넘기면 막대를 가득 채우고 초과 금액을 알린다.
 */
export function IncomeExpenseMeter({ income, expense }: Props) {
  const hasIncome = income > 0;
  const ratio = hasIncome ? expense / income : expense > 0 ? Infinity : 0;
  const isOver = ratio > 1;
  const percent = hasIncome ? Math.round(ratio * 100) : null;
  const fillWidth = `${Math.min(ratio, 1) * 100}%`;

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
