'use client';

import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@uandi/ui';
import { formatCurrencyMan } from '@/utils/currency';
import type { AnnualPlanValidation } from '@/services/annual-plan';

type PlanWizardValidateProps = {
  validation: AnnualPlanValidation;
};

export function PlanWizardValidate({ validation }: PlanWizardValidateProps) {
  const { ok, deficit, totals } = validation;
  const surplus = totals.income - totals.expense - totals.flex;

  return (
    <div className="space-y-5" data-testid="wizard-validate">
      <header>
        <div className="text-[12px] font-medium text-stone-500">5단계 · 검증</div>
        <h1 className="mt-1 text-[20px] font-bold leading-tight text-stone-900">
          수입이 지출 + Flex를
          <br />
          감당할 수 있는지 확인해요
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
          수입 ≥ 지출 + Flex 일 때만 다음 단계로 넘어갈 수 있어요.
        </p>
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
              {ok ? '검증 통과' : '예산이 부족해요'}
            </div>
            <div
              className={cn(
                'mt-0.5 text-[12px] leading-relaxed',
                ok ? 'text-sage-700/80' : 'text-coral-700/80'
              )}
            >
              {ok
                ? `수입에서 지출과 Flex를 빼고 ${formatCurrencyMan(surplus)}원이 남아요.`
                : `지출 + Flex 합계가 수입보다 ${formatCurrencyMan(deficit)}원 더 많아요.`}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <TotalRow label="연간 수입" amount={totals.income} sign="+" tone="income" />
        <TotalRow label="연간 지출" amount={totals.expense} sign="-" tone="expense" />
        <TotalRow label="연간 Flex" amount={totals.flex} sign="-" tone="flex" />
        <div className="my-1.5 h-px bg-stone-200" />
        <TotalRow
          label={ok ? '잉여' : '부족'}
          amount={ok ? surplus : deficit}
          sign={ok ? '+' : '-'}
          tone={ok ? 'surplus' : 'deficit'}
          emphasized
        />
      </section>

      {!ok && (
        <p className="text-center text-[12px] leading-relaxed text-stone-500">
          이전 단계로 돌아가 지출/Flex 항목을 줄이거나
          <br />
          수입 항목을 늘려보세요.
        </p>
      )}
    </div>
  );
}

type Tone = 'income' | 'expense' | 'flex' | 'surplus' | 'deficit';

function TotalRow({
  label,
  amount,
  sign,
  tone,
  emphasized,
}: {
  label: string;
  amount: number;
  sign: '+' | '-';
  tone: Tone;
  emphasized?: boolean;
}) {
  const colorClass = {
    income: 'text-sage-600',
    expense: 'text-coral-600',
    flex: 'text-violet-500',
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
        {formatCurrencyMan(amount)}원
      </span>
    </div>
  );
}
