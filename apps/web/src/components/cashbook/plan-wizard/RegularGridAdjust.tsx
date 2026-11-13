'use client';

import { useTranslations } from 'next-intl';
import { Button, cn } from '@uandi/ui';
import { RotateCcw } from 'lucide-react';
import { CategoryHeader } from './RegularAvgInput';
import { MonthlyGrid } from '../MonthlyGrid';
import { formatCurrencyMan } from '@/utils/currency';
import type { CashbookCategory } from '@/types';

type RegularGridAdjustProps = {
  category: CashbookCategory;
  /** 자동채움 기준값 (baseMonthlyAmount). 평균 단계에서 입력한 값. */
  baseAmount: number;
  /** 길이 12 */
  monthlyAmounts: number[];
  onChange: (next: number[]) => void;
};

export function RegularGridAdjust({
  category,
  baseAmount,
  monthlyAmounts,
  onChange,
}: RegularGridAdjustProps) {
  const t = useTranslations('cashbook.wizard.adjust');
  const tDash = useTranslations('dashboard');
  const won = (amount: string) => tDash('won', { amount });
  const annual = monthlyAmounts.reduce((s, v) => s + v, 0);
  const baseAnnual = baseAmount * 12;
  const diff = annual - baseAnnual;

  const handleReset = () => {
    onChange(Array(12).fill(baseAmount));
  };

  return (
    <div className="space-y-5" data-testid="regular-grid-adjust">
      <CategoryHeader category={category} caption={t('caption')} />

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] text-stone-500">{t('monthlyAvg')}</div>
            <div className="text-[15px] font-semibold tabular-nums text-stone-800">
              {won(formatCurrencyMan(baseAmount))}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1.5"
            data-testid="regular-grid-reset"
          >
            <RotateCcw size={14} />
            {t('resetToAvg')}
          </Button>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-stone-500">{t('description')}</p>
      </section>

      <MonthlyGrid
        values={monthlyAmounts}
        onChange={onChange}
        highlightChanged
        baseline={Array(12).fill(baseAmount)}
        inputTestIdPrefix="regular-grid-cell"
      />

      <section className="rounded-2xl border border-coral-100 bg-coral-50/60 px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium text-coral-700">{t('annualTotal')}</span>
          <span
            className="text-[18px] font-bold tabular-nums text-coral-700"
            data-testid="regular-grid-annual"
          >
            {won(formatCurrencyMan(annual))}
          </span>
        </div>
        {diff !== 0 && (
          <div
            className={cn(
              'mt-1 text-right text-[11px] font-semibold tabular-nums',
              diff > 0 ? 'text-sage-500' : 'text-coral-500'
            )}
          >
            {t('vsAvg', { sign: diff > 0 ? '+' : '', amount: won(formatCurrencyMan(diff)) })}
          </div>
        )}
      </section>
    </div>
  );
}
