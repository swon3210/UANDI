'use client';

import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import { formatCurrencyMan } from '@/utils/currency';
import type { AnnualPlanValidation } from '@/services/annual-plan';

export type BulkEditTotals = {
  income: number;
  expense: number;
  flex: number;
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
  const hasChanges = changedCount > 0;
  const canSave = hasChanges && validation.ok && !saving;

  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur"
      data-testid="bulk-edit-summary-bar"
    >
      <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))]">
        <ValidationLine validation={validation} hasChanges={hasChanges} />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <DeltaPill
            label="수입"
            before={totalsBefore.income}
            after={totalsAfter.income}
            tone="income"
            testId="bulk-edit-delta-income"
          />
          <DeltaPill
            label="지출"
            before={totalsBefore.expense}
            after={totalsAfter.expense}
            tone="expense"
            testId="bulk-edit-delta-expense"
          />
          <DeltaPill
            label="Flex"
            before={totalsBefore.flex}
            after={totalsAfter.flex}
            tone="flex"
            testId="bulk-edit-delta-flex"
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
            전체 되돌리기
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            data-testid="bulk-edit-save"
            className="flex-1"
          >
            {saving ? '저장 중...' : hasChanges ? `${changedCount}개 항목 저장` : '변경 사항 없음'}
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
  const { ok, deficit, totals, deficitMonths } = validation;
  const surplus = totals.income - totals.expense - totals.flex;
  const monthlyOnlyIssue = deficit <= 0 && deficitMonths.length > 0;

  if (!hasChanges) {
    return (
      <div
        className="flex items-center gap-1.5 text-[12px] text-stone-500"
        data-testid="bulk-edit-validation"
      >
        <span>변경 사항이 없어요. 셀을 수정하면 차이가 표시됩니다.</span>
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
          ? `검증 통과 · 잉여 ${formatCurrencyMan(surplus)}원`
          : monthlyOnlyIssue
            ? `${deficitMonths.length}개월 적자 · 매달 수입이 지출을 못 따라가요`
            : `예산 부족 · ${formatCurrencyMan(deficit)}원 초과`}
      </span>
    </div>
  );
}

type DeltaTone = 'income' | 'expense' | 'flex';

const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  income: 'border-sage-200 bg-sage-50 text-sage-700',
  expense: 'border-coral-200 bg-coral-50 text-coral-700',
  flex: 'border-violet-200 bg-violet-50 text-violet-700',
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
        {delta === 0 ? '변동 없음' : `${sign}${formatCurrencyMan(Math.abs(delta))}`}
      </div>
    </div>
  );
}
