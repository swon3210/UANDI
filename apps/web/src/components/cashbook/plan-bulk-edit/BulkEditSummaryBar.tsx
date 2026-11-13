'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import { formatCurrencyMan } from '@/utils/currency';
import type { AnnualPlanValidation } from '@/services/annual-plan';

export type BulkEditTotals = {
  income: number;
  expense: number;
};

type BulkEditSummaryBarProps = {
  totalsBefore: BulkEditTotals;
  totalsAfter: BulkEditTotals;
  validation: AnnualPlanValidation;
  /** 변경된 행 수 */
  changedCount: number;
  saving: boolean;
  onSave: () => void;
  onResetAll: () => void;
};

export function BulkEditSummaryBar({
  totalsBefore,
  totalsAfter,
  validation,
  changedCount,
  saving,
  onSave,
  onResetAll,
}: BulkEditSummaryBarProps) {
  const t = useTranslations('cashbook.bulkEdit');
  const tDash = useTranslations('dashboard');
  const won = (amount: string) => tDash('won', { amount });
  const hasChanges = changedCount > 0;
  const canSave = hasChanges && validation.ok && !saving;

  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur"
      data-testid="bulk-edit-summary-bar"
    >
      <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))]">
        <ValidationLine validation={validation} hasChanges={hasChanges} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <DeltaPill
            label={t('income')}
            before={totalsBefore.income}
            after={totalsAfter.income}
            tone="income"
            testId="bulk-edit-delta-income"
          />
          <DeltaPill
            label={t('expense')}
            before={totalsBefore.expense}
            after={totalsAfter.expense}
            tone="expense"
            testId="bulk-edit-delta-expense"
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onResetAll}
            disabled={!hasChanges || saving}
            data-testid="bulk-edit-reset-all"
            className="gap-1.5"
          >
            <RotateCcw size={14} />
            {t('resetAll')}
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            data-testid="bulk-edit-save"
            className="flex-1"
          >
            {saving
              ? t('saving')
              : hasChanges
                ? t('saveCount', { count: changedCount })
                : t('noChanges')}
          </Button>
        </div>
      </div>
    </footer>
  );
}

function ValidationLine({
  validation,
  hasChanges,
}: {
  validation: AnnualPlanValidation;
  hasChanges: boolean;
}) {
  const t = useTranslations('cashbook.bulkEdit');
  const tDash = useTranslations('dashboard');
  const won = (amount: string) => tDash('won', { amount });
  const { ok, deficit, totals, deficitMonths } = validation;
  const surplus = totals.income - totals.expense;
  const monthlyOnlyIssue = deficit <= 0 && deficitMonths.length > 0;

  if (!hasChanges) {
    return (
      <div
        className="flex items-center gap-1.5 text-[12px] text-stone-500"
        data-testid="bulk-edit-validation"
      >
        <span>{t('noChangesHint')}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-[12px] font-medium',
        ok ? 'text-sage-700' : 'text-coral-700'
      )}
      data-testid="bulk-edit-validation"
    >
      {ok ? (
        <CheckCircle2 size={14} className="shrink-0" />
      ) : (
        <AlertTriangle size={14} className="shrink-0" />
      )}
      <span>
        {ok
          ? t('ok', { amount: won(formatCurrencyMan(surplus)) })
          : monthlyOnlyIssue
            ? t('monthlyIssue', { count: deficitMonths.length })
            : t('short', { amount: won(formatCurrencyMan(deficit)) })}
      </span>
    </div>
  );
}

type DeltaTone = 'income' | 'expense';

const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  income: 'border-sage-200 bg-sage-50 text-sage-700',
  expense: 'border-coral-200 bg-coral-50 text-coral-700',
};

function DeltaPill({
  label,
  before,
  after,
  tone,
  testId,
}: {
  label: string;
  before: number;
  after: number;
  tone: DeltaTone;
  testId?: string;
}) {
  const t = useTranslations('cashbook.bulkEdit');
  const delta = after - before;
  const sign = delta > 0 ? '+' : delta < 0 ? '-' : '±';

  return (
    <div
      className={cn('rounded-xl border px-2.5 py-1.5 text-center', DELTA_TONE_CLASS[tone])}
      data-testid={testId}
    >
      <div className="text-[10px] font-medium opacity-80">{label}</div>
      <div className="mt-0.5 text-[13px] font-bold tabular-nums">{formatCurrencyMan(after)}</div>
      <div className="text-[10px] tabular-nums opacity-80">
        {delta === 0 ? t('noDelta') : `${sign}${formatCurrencyMan(Math.abs(delta))}`}
      </div>
    </div>
  );
}
