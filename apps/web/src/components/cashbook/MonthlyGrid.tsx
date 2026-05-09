'use client';

import { useState } from 'react';
import { cn } from '@uandi/ui';
import { MONTH_LABELS } from '@/constants/plan-wizard';
import { formatCurrencyMan } from '@/utils/currency';

type MonthlyGridProps = {
  /** 길이 12 — 1월=index 0 */
  values: number[];
  onChange: (values: number[]) => void;
  /** 변경 셀에 highlight 표시 (일괄수정에서 사용) */
  highlightChanged?: boolean;
  /** 비교 기준값 (highlight 계산에 사용). 길이 12. */
  baseline?: number[];
  /** 셀 disabled 여부 */
  disabled?: boolean;
  /** Tailwind 컬럼 grid (기본 4열) */
  columnsClassName?: string;
  className?: string;
  inputTestIdPrefix?: string;
};

export function MonthlyGrid({
  values,
  onChange,
  highlightChanged = false,
  baseline,
  disabled = false,
  columnsClassName = 'grid-cols-3 sm:grid-cols-4',
  className,
  inputTestIdPrefix,
}: MonthlyGridProps) {
  return (
    <div className={cn('grid gap-2', columnsClassName, className)}>
      {values.map((value, idx) => {
        const changed =
          highlightChanged && baseline ? baseline[idx] !== value : false;
        return (
          <MonthCell
            key={idx}
            month={idx + 1}
            value={value}
            disabled={disabled}
            changed={changed}
            testId={inputTestIdPrefix ? `${inputTestIdPrefix}-${idx + 1}` : undefined}
            onChange={(next) => {
              const arr = values.slice();
              arr[idx] = next;
              onChange(arr);
            }}
          />
        );
      })}
    </div>
  );
}

type MonthCellProps = {
  month: number;
  value: number;
  disabled: boolean;
  changed: boolean;
  testId?: string;
  onChange: (next: number) => void;
};

function MonthCell({ month, value, disabled, changed, testId, onChange }: MonthCellProps) {
  /** focus 중에만 사용하는 draft. null = unfocused (formatted prop 직접 표시) */
  const [draft, setDraft] = useState<string | null>(null);
  const focused = draft !== null;
  const display = focused ? draft! : formatNumber(value);

  return (
    <label
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-xl border px-2.5 py-2 transition-colors',
        changed
          ? 'border-coral-300 bg-coral-50/60'
          : 'border-stone-200 bg-white',
        disabled && 'opacity-60'
      )}
    >
      <span className="text-[11px] font-medium text-stone-500">
        {MONTH_LABELS[month - 1]}
      </span>
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={display}
        data-testid={testId}
        onFocus={() => setDraft(value === 0 ? '' : String(value))}
        onBlur={() => setDraft(null)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, '');
          setDraft(raw);
          const num = raw === '' ? 0 : Number(raw);
          if (Number.isFinite(num)) onChange(num);
        }}
        className={cn(
          'w-full bg-transparent text-right text-[15px] font-semibold tabular-nums text-stone-900 outline-none',
          'placeholder:text-stone-300'
        )}
        placeholder="0"
      />
      {value > 0 && !focused && (
        <span className="text-right text-[10px] text-stone-400">
          {formatCurrencyMan(value)}원
        </span>
      )}
    </label>
  );
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '';
  return n.toLocaleString('ko-KR');
}
