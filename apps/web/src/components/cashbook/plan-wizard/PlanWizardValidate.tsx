'use client';

import { useMonthLabels } from '@/i18n/cashbook-labels';
import { useTranslations } from 'next-intl';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@uandi/ui';
import { formatCurrencyMan } from '@/utils/currency';
import type { AnnualPlanValidation } from '@/services/annual-plan';

type PlanWizardValidateProps = {
  validation: AnnualPlanValidation;
};

export function PlanWizardValidate({ validation }: PlanWizardValidateProps) {
  const t = useTranslations('cashbook.wizard.validate');
  const tDash = useTranslations('dashboard');
  const won = (amount: string) => tDash('won', { amount });
  const monthLabels = useMonthLabels();
  const { ok, deficit, totals, monthly, deficitMonths } = validation;
  const surplus = totals.income - totals.expense;
  const annualOk = deficit <= 0;
  // 연간은 흑자인데 특정 달만 적자인 경우 메시지를 분기한다.
  const monthlyOnlyIssue = annualOk && deficitMonths.length > 0;

  return (
    <div className="space-y-5" data-testid="wizard-validate">
      <header>
        <div className="text-[12px] font-medium text-stone-500">{t('step')}</div>
        <h1 className="mt-1 text-[20px] font-bold leading-tight text-stone-900">
          {t.rich('headline', { br: () => <br /> })}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-stone-500">{t('description')}</p>
      </header>

      <section
        className={cn(
          'rounded-2xl border p-5',
          ok ? 'border-sage-200 bg-sage-50' : 'border-coral-200 bg-coral-50'
        )}
        data-testid="wizard-validate-status"
      >
        <div className="flex items-start gap-3">
          {ok ? (
            <CheckCircle2 size={28} className="shrink-0 text-sage-500" />
          ) : (
            <AlertTriangle size={28} className="shrink-0 text-coral-500" />
          )}
          <div className="min-w-0">
            <div className={cn('text-[15px] font-bold', ok ? 'text-sage-700' : 'text-coral-700')}>
              {ok ? t('ok') : monthlyOnlyIssue ? t('monthlyIssue') : t('short')}
            </div>
            <div
              className={cn(
                'mt-0.5 text-[12px] leading-relaxed',
                ok ? 'text-sage-700/80' : 'text-coral-700/80'
              )}
            >
              {ok
                ? t('okDetail', { amount: won(formatCurrencyMan(surplus)) })
                : monthlyOnlyIssue
                  ? t('monthlyDetail', { count: deficitMonths.length })
                  : t('shortDetail', { amount: won(formatCurrencyMan(deficit)) })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <TotalRow
          label={t('annualIncome')}
          amount={totals.income}
          sign="+"
          tone="income"
          won={won}
        />
        <TotalRow
          label={t('annualExpense')}
          amount={totals.expense}
          sign="-"
          tone="expense"
          won={won}
        />
        <div className="my-1.5 h-px bg-stone-200" />
        <TotalRow
          label={ok ? t('surplus') : t('deficit')}
          won={won}
          amount={ok ? surplus : deficit}
          sign={ok ? '+' : '-'}
          tone={ok ? 'surplus' : 'deficit'}
          emphasized
        />
      </section>

      {deficitMonths.length > 0 && (
        <section
          className="rounded-2xl border border-coral-200 bg-coral-50/60 p-4"
          data-testid="wizard-validate-deficit-months"
        >
          <div className="text-[12px] font-semibold text-coral-700">{t('deficitMonths')}</div>
          <div className="mt-2 space-y-1.5">
            {deficitMonths.map((m) => (
              <div
                key={m}
                className="flex items-baseline justify-between text-[12px]"
                data-testid={`validate-deficit-month-${m}`}
              >
                <span className="text-stone-700">{monthLabels[m]}</span>
                <span className="tabular-nums font-semibold text-coral-700">
                  -{won(formatCurrencyMan(-monthly[m].surplus))}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {!ok && (
        <p className="text-center text-[12px] leading-relaxed text-stone-500">
          {t.rich('advice', { br: () => <br /> })}
        </p>
      )}
    </div>
  );
}

type Tone = 'income' | 'expense' | 'surplus' | 'deficit';

function TotalRow({
  label,
  amount,
  sign,
  tone,
  emphasized,
  won,
}: {
  label: string;
  amount: number;
  sign: '+' | '-';
  tone: Tone;
  emphasized?: boolean;
  won: (amount: string) => string;
}) {
  const colorClass = {
    income: 'text-sage-600',
    expense: 'text-coral-600',
    surplus: 'text-sage-700',
    deficit: 'text-coral-700',
  }[tone];

  return (
    <div
      className={cn(
        'flex items-baseline justify-between rounded-xl bg-white px-4 py-3',
        emphasized && 'border border-stone-200 shadow-sm'
      )}
      data-testid={`validate-row-${tone}`}
    >
      <span
        className={cn('text-[13px] text-stone-700', emphasized && 'font-semibold text-stone-900')}
      >
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums font-semibold',
          colorClass,
          emphasized ? 'text-[18px]' : 'text-[15px]'
        )}
      >
        {sign}
        {won(formatCurrencyMan(amount))}
      </span>
    </div>
  );
}
