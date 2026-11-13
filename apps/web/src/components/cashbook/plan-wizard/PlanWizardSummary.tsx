'use client';

import { useMonthLabels } from '@/i18n/cashbook-labels';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { cn } from '@uandi/ui';
import { formatCurrencyMan } from '@/utils/currency';
import type { AnnualPlanItem } from '@/types';

type PlanWizardSummaryProps = {
  year: number;
  items: AnnualPlanItem[];
  /** 완료 버튼 — 페이지에서 mutation 후 메인으로 redirect */
  saving?: boolean;
};

export function PlanWizardSummary({ year, items, saving }: PlanWizardSummaryProps) {
  const t = useTranslations('cashbook.wizard.summary');
  const tDash = useTranslations('dashboard');
  const won = (amount: string) => tDash('won', { amount });
  const monthLabels = useMonthLabels();
  const monthlyByGroup = computeMonthlyByGroup(items);
  const totals = {
    income: monthlyByGroup.income.reduce((s, v) => s + v, 0),
    expense: monthlyByGroup.expense.reduce((s, v) => s + v, 0),
  };
  const surplus = totals.income - totals.expense;
  const peakMonthIdx = peakMonth(monthlyByGroup);

  return (
    <div className="space-y-5" data-testid="wizard-summary">
      <header>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-coral-500">
          <Sparkles size={14} />
          <span>{t('eyebrow', { year })}</span>
        </div>
        <h1 className="mt-1 text-[20px] font-bold leading-tight text-stone-900">
          {saving ? t('saving') : t('ready')}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
          {t.rich('surplusIntro', {
            amount: won(formatCurrencyMan(surplus)),
            strong: (chunks) => <strong className="font-semibold text-stone-700">{chunks}</strong>,
          })}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-2">
        <SummaryStat label={t('annualIncome')} amount={totals.income} tone="income" />
        <SummaryStat label={t('annualExpense')} amount={totals.expense} tone="expense" />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-[13px] font-semibold text-stone-900">{t('monthlyTitle')}</h2>
        <p className="mt-0.5 text-[11px] text-stone-500">
          {t.rich('peakMonth', {
            month: monthLabels[peakMonthIdx],
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <div className="mt-3 space-y-1.5">
          {Array.from({ length: 12 }).map((_, m) => (
            <MonthRow
              key={m}
              monthIdx={m}
              income={monthlyByGroup.income[m]}
              expense={monthlyByGroup.expense[m]}
              isPeak={m === peakMonthIdx}
              monthLabel={monthLabels[m]}
            />
          ))}
        </div>
      </section>

      <p className="text-center text-[12px] text-stone-400">{t('footer')}</p>
    </div>
  );
}

function SummaryStat({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: 'income' | 'expense';
}) {
  const cls = {
    income: 'border-sage-200 bg-sage-50 text-sage-700',
    expense: 'border-coral-200 bg-coral-50 text-coral-700',
  }[tone];
  return (
    <div className={cn('rounded-xl border px-3 py-3 text-center', cls)}>
      <div className="text-[10px] font-medium opacity-80">{label}</div>
      <div className="mt-0.5 text-[15px] font-bold tabular-nums">{formatCurrencyMan(amount)}</div>
    </div>
  );
}

function MonthRow({
  income,
  expense,
  isPeak,
  monthLabel,
}: {
  monthIdx: number;
  income: number;
  expense: number;
  isPeak: boolean;
  monthLabel: string;
}) {
  const monthSurplus = income - expense;
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] tabular-nums',
        isPeak ? 'bg-coral-50' : 'bg-stone-50'
      )}
    >
      <span className="w-9 shrink-0 font-semibold text-stone-700">{monthLabel}</span>
      <span className="flex-1 text-right text-sage-600">+{formatCurrencyMan(income)}</span>
      <span className="flex-1 text-right text-coral-600">-{formatCurrencyMan(expense)}</span>
      <span
        className={cn(
          'w-16 shrink-0 text-right font-semibold',
          monthSurplus >= 0 ? 'text-stone-800' : 'text-coral-700'
        )}
      >
        {monthSurplus >= 0 ? '+' : ''}
        {formatCurrencyMan(monthSurplus)}
      </span>
    </div>
  );
}

function computeMonthlyByGroup(items: AnnualPlanItem[]) {
  const result = {
    income: Array(12).fill(0) as number[],
    expense: Array(12).fill(0) as number[],
  };
  for (const item of items) {
    const arr = result[item.group];
    if (!arr) continue;
    for (let m = 0; m < 12; m += 1) {
      arr[m] += item.monthlyAmounts[m] ?? 0;
    }
  }
  return result;
}

function peakMonth(monthly: ReturnType<typeof computeMonthlyByGroup>): number {
  let bestIdx = 0;
  let bestVal = -Infinity;
  for (let m = 0; m < 12; m += 1) {
    const out = monthly.expense[m];
    if (out > bestVal) {
      bestVal = out;
      bestIdx = m;
    }
  }
  return bestIdx;
}
