'use client';

import { useTranslations } from 'next-intl';
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
 * 수입 없이 지출만 있으면 상태 줄을 숨긴다. 월급날 전에는 수입이 없는 게 당연해서
 * "아직 수입을 안 적었어요" 같은 문구가 빠뜨린 것처럼 읽혔다(2026-11 걷기). 수입 0원 칸으로 충분하다.
 */
export function IncomeExpenseMeter({ income, expense }: Props) {
  const t = useTranslations('dashboard.meter');
  const hasIncome = income > 0;
  const ratio = hasIncome ? expense / income : expense > 0 ? Infinity : 0;
  const isOver = ratio > 1;
  const percent = hasIncome ? Math.round(ratio * 100) : null;
  const fillWidth = `${Math.min(ratio, 1) * 100}%`;
  const showStatus = hasIncome || expense === 0;

  return (
    <div data-testid="income-expense-meter" className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <span className="text-xs text-muted-foreground">{t('title')}</span>
        <span
          data-testid="meter-percent"
          className={cn('text-2xl font-semibold', isOver ? 'text-expense' : 'text-foreground')}
        >
          {percent !== null ? `${percent}%` : '—'}
        </span>
      </div>

      <div
        role="meter"
        aria-label={t('title')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? 100}
        aria-valuetext={percent !== null ? t('valueText', { percent }) : t('noIncome')}
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
            {t('income')}
          </dt>
          <dd data-testid="meter-income" className="mt-0.5 text-sm font-semibold tabular-nums">
            {formatCurrency(income)}
          </dd>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full bg-expense" />
            {t('expense')}
          </dt>
          <dd data-testid="meter-expense" className="mt-0.5 text-sm font-semibold tabular-nums">
            {formatCurrency(expense)}
          </dd>
        </div>
      </dl>

      {showStatus && (
        <div
          data-testid="meter-status"
          className="flex min-h-10 items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm font-semibold"
        >
          {!hasIncome ? (
            <span className="text-muted-foreground">{t('empty')}</span>
          ) : isOver ? (
            <span>
              🚨 <span className="text-muted-foreground">{t('overPrefix')}</span>
              <span className="font-extrabold tabular-nums text-expense">
                {formatCurrency(expense - income)}
              </span>
              <span className="text-muted-foreground">{t('overSuffix')}</span>
            </span>
          ) : (
            <span>
              😎 <span className="text-muted-foreground">{t('leftPrefix')}</span>
              <span className="font-extrabold tabular-nums text-income">
                {formatCurrency(income - expense)}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
