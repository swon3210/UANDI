'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@uandi/ui';
import { MONTH_LABELS } from '@/constants/plan-wizard';
import { formatCurrencyMan } from '@/utils/currency';
import type { AnnualPlanItem } from '@/types';

type PlanWizardSummaryProps = {
  year: number;
  items: AnnualPlanItem[];
  /** 완료 버튼 — 페이지에서 mutation 후 메인으로 redirect */
  saving?: boolean;
};

export function PlanWizardSummary({ year, items, saving }: PlanWizardSummaryProps) {
  const monthlyByGroup = computeMonthlyByGroup(items);
  const totals = {
    income: monthlyByGroup.income.reduce((s, v) => s + v, 0),
    expense: monthlyByGroup.expense.reduce((s, v) => s + v, 0),
    flex: monthlyByGroup.flex.reduce((s, v) => s + v, 0),
  };
  const surplus = totals.income - totals.expense - totals.flex;
  const peakMonthIdx = peakMonth(monthlyByGroup);

  return (
    <div className="space-y-5" data-testid="wizard-summary">
      <header>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-coral-500">
          <Sparkles size={14} />
          <span>{year}년 예산 완성</span>
        </div>
        <h1 className="mt-1 text-[20px] font-bold leading-tight text-stone-900">
          {saving ? '저장 중...' : '예산 계획이 준비됐어요'}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
          연간 잉여 <strong className="font-semibold text-stone-700">{formatCurrencyMan(surplus)}원</strong>으로
          한 해를 시작합니다.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2">
        <SummaryStat label="연간 수입" amount={totals.income} tone="income" />
        <SummaryStat label="연간 지출" amount={totals.expense} tone="expense" />
        <SummaryStat label="연간 Flex" amount={totals.flex} tone="flex" />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-[13px] font-semibold text-stone-900">월별 합계</h2>
        <p className="mt-0.5 text-[11px] text-stone-500">
          가장 많이 지출이 잡힌 달은 <strong>{MONTH_LABELS[peakMonthIdx]}</strong>이에요.
        </p>
        <div className="mt-3 space-y-1.5">
          {Array.from({ length: 12 }).map((_, m) => (
            <MonthRow
              key={m}
              monthIdx={m}
              income={monthlyByGroup.income[m]}
              expense={monthlyByGroup.expense[m]}
              flex={monthlyByGroup.flex[m]}
              isPeak={m === peakMonthIdx}
            />
          ))}
        </div>
      </section>

      <p className="text-center text-[12px] text-stone-400">
        완료를 누르면 수정 이력에 기록되고 메인 페이지로 돌아갑니다.
      </p>
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
  tone: 'income' | 'expense' | 'flex';
}) {
  const cls = {
    income: 'border-sage-200 bg-sage-50 text-sage-700',
    expense: 'border-coral-200 bg-coral-50 text-coral-700',
    flex: 'border-violet-200 bg-violet-50 text-violet-700',
  }[tone];
  return (
    <div className={cn('rounded-xl border px-3 py-3 text-center', cls)}>
      <div className="text-[10px] font-medium opacity-80">{label}</div>
      <div className="mt-0.5 text-[15px] font-bold tabular-nums">
        {formatCurrencyMan(amount)}
      </div>
    </div>
  );
}

function MonthRow({
  monthIdx,
  income,
  expense,
  flex,
  isPeak,
}: {
  monthIdx: number;
  income: number;
  expense: number;
  flex: number;
  isPeak: boolean;
}) {
  const monthSurplus = income - expense - flex;
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] tabular-nums',
        isPeak ? 'bg-coral-50' : 'bg-stone-50'
      )}
    >
      <span className="w-9 shrink-0 font-semibold text-stone-700">
        {MONTH_LABELS[monthIdx]}
      </span>
      <span className="flex-1 text-right text-sage-600">+{formatCurrencyMan(income)}</span>
      <span className="flex-1 text-right text-coral-600">-{formatCurrencyMan(expense)}</span>
      <span className="flex-1 text-right text-violet-500">-{formatCurrencyMan(flex)}</span>
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
    flex: Array(12).fill(0) as number[],
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
    const out = monthly.expense[m] + monthly.flex[m];
    if (out > bestVal) {
      bestVal = out;
      bestIdx = m;
    }
  }
  return bestIdx;
}
