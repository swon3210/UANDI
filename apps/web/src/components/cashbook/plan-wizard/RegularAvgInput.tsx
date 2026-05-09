'use client';

import { useState } from 'react';
import { Input } from '@uandi/ui';
import { CategoryIcon } from '@/components/cashbook/CategoryIcon';
import { formatCurrencyMan } from '@/utils/currency';
import type { CashbookCategory } from '@/types';

type RegularAvgInputProps = {
  category: CashbookCategory;
  /** 현재 평균값 (baseMonthlyAmount) */
  value: number;
  onChange: (next: number) => void;
};

export function RegularAvgInput({ category, value, onChange }: RegularAvgInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft !== null ? draft : formatNumber(value);

  const annual = value * 12;

  return (
    <div className="space-y-5" data-testid="regular-avg-input">
      <CategoryHeader category={category} caption="정기 항목 · 1단계" />

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <label className="block">
          <div className="text-[13px] font-medium text-stone-700">월 평균 금액</div>
          <div className="mt-3 flex items-baseline gap-2">
            <Input
              type="text"
              inputMode="numeric"
              value={display}
              data-testid="regular-avg-input-field"
              onFocus={() => setDraft(value === 0 ? '' : String(value))}
              onBlur={() => setDraft(null)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                setDraft(raw);
                const num = raw === '' ? 0 : Number(raw);
                if (Number.isFinite(num)) onChange(num);
              }}
              className="h-12 flex-1 text-right text-[20px] font-bold tabular-nums"
              placeholder="0"
            />
            <span className="text-[14px] font-semibold text-stone-500">원</span>
          </div>
          {value > 0 && (
            <div className="mt-1 text-right text-[12px] text-stone-400">
              {formatCurrencyMan(value)}원
            </div>
          )}
        </label>
      </section>

      <section className="rounded-2xl border border-coral-100 bg-coral-50/60 px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium text-coral-700">연간 합계 (× 12)</span>
          <span
            className="text-[18px] font-bold tabular-nums text-coral-700"
            data-testid="regular-avg-annual"
          >
            {formatCurrencyMan(annual)}원
          </span>
        </div>
        <p className="mt-1 text-[11px] text-coral-600/80">
          다음 단계에서 12개월 그리드로 특정 달을 조정할 수 있어요.
        </p>
      </section>
    </div>
  );
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '';
  return n.toLocaleString('ko-KR');
}

export function CategoryHeader({
  category,
  caption,
}: {
  category: CashbookCategory;
  caption: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${category.color}1A` }}
      >
        <CategoryIcon name={category.icon} size={22} color={category.color} />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] text-stone-500">{caption}</div>
        <div className="truncate text-[16px] font-semibold text-stone-900">
          {category.name}
        </div>
      </div>
    </div>
  );
}
