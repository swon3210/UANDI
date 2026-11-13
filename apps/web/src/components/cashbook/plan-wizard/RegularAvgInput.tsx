'use client';

import { useTranslations } from 'next-intl';
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
  /** 헤더 캡션. 빠른 모드의 변동 항목 등 "정기 항목 · 1단계"가 아닐 때 바꾼다 */
  caption?: string;
  /** 입력 아래 안내(예: 수입은 "두 사람 수입을 합쳐 적어요") */
  hint?: string;
  /** 연간 합계 카드의 보조 문구. 빠른 모드(그리드 없음)에서는 비운다 */
  annualNote?: string | null;
};

export function RegularAvgInput({
  category,
  value,
  onChange,
  caption,
  hint,
  annualNote,
}: RegularAvgInputProps) {
  const t = useTranslations('cashbook.wizard.avg');
  const tDash = useTranslations('dashboard');
  const won = (amount: string) => tDash('won', { amount });
  const resolvedCaption = caption ?? t('caption');
  const resolvedNote = annualNote === undefined ? t('annualNote') : annualNote;
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft !== null ? draft : formatNumber(value);

  const annual = value * 12;

  return (
    <div className="space-y-5" data-testid="regular-avg-input">
      <CategoryHeader category={category} caption={resolvedCaption} />

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <label className="block">
          <div className="text-[13px] font-medium text-stone-700">{t('monthlyAvg')}</div>
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
            <span className="text-[14px] font-semibold text-stone-500">{t('won')}</span>
          </div>
          {value > 0 && (
            <div className="mt-1 text-right text-[12px] text-stone-400">
              {won(formatCurrencyMan(value))}
            </div>
          )}
        </label>
        {hint ? (
          <p
            className="mt-3 text-[12px] leading-relaxed text-stone-500"
            data-testid="regular-avg-hint"
          >
            {hint}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-coral-100 bg-coral-50/60 px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] font-medium text-coral-700">{t('annualTotal')}</span>
          <span
            className="text-[18px] font-bold tabular-nums text-coral-700"
            data-testid="regular-avg-annual"
          >
            {won(formatCurrencyMan(annual))}
          </span>
        </div>
        {resolvedNote ? <p className="mt-1 text-[11px] text-coral-600/80">{resolvedNote}</p> : null}
      </section>
    </div>
  );
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '';
  return Math.round(n).toLocaleString('ko-KR');
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
        <div className="truncate text-[16px] font-semibold text-stone-900">{category.name}</div>
      </div>
    </div>
  );
}
