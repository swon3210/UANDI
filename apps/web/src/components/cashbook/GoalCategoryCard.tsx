'use client';

import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { cn } from '@uandi/ui';
import { formatCurrencyMan } from '@/utils/currency';
import type { GoalCategoryTheme } from '@/constants/goal-categories';

type GoalCategoryCardProps = {
  theme: GoalCategoryTheme;
  /** 연간 목표 금액 (annualPlanItems의 합계) */
  goal: number;
  /** 현재 달성액 (옵션). null/undefined면 진행률 미표시 */
  actual?: number;
  /** 항목 개수 */
  itemCount: number;
  /** 카드 클릭 핸들러 — drill-down */
  onSelect: () => void;
};

export function GoalCategoryCard({
  theme,
  goal,
  actual,
  itemCount,
  onSelect,
}: GoalCategoryCardProps) {
  const t = useTranslations('cashbook.goals');
  const tDash = useTranslations('dashboard');
  const won = (amount: string) => tDash('won', { amount });
  const label = t(`${theme.key}.label`);
  const pct = goal > 0 && actual != null ? Math.round((actual / goal) * 100) : 0;
  const showProgress = actual != null && goal > 0;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-stone-200 bg-card shadow-[0_2px_8px_hsl(20_6%_10%/0.05)]"
      data-testid={`goal-card-${theme.key}`}
    >
      <div className="px-4 pt-4 pb-3.5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[22px]',
              theme.softBgClass,
              theme.softBorderClass
            )}
          >
            {theme.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-stone-900">{label}</div>
            <div className="mt-0.5 truncate text-xs text-stone-400">
              {t(`${theme.key}.goalLabel`)}
            </div>
          </div>
          <div className="text-right">
            <div
              className={cn('text-[18px] font-bold tabular-nums', theme.accentClass)}
              data-testid={`goal-card-${theme.key}-amount`}
            >
              {won(formatCurrencyMan(goal))}
            </div>
            {actual != null && (
              <div className="mt-0.5 text-[11px] text-stone-400">
                {t('current', { amount: won(formatCurrencyMan(actual)) })}
              </div>
            )}
          </div>
        </div>

        {showProgress && (
          <div className="mt-3.5">
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className={cn('h-full rounded-full transition-[width]', theme.accentBgClass)}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-stone-400">
              <span>{t('achieved', { pct })}</span>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSelect}
        aria-label={t('setItems', { label })}
        className={cn(
          'flex w-full items-center justify-between border-t px-4 py-3 transition-[filter] hover:brightness-[0.97]',
          theme.softBgClass,
          theme.softBorderClass
        )}
        data-testid={`goal-card-${theme.key}-cta`}
      >
        <span className={cn('text-[13px] font-semibold', theme.accentClass)}>
          {t('setItemsShort')}
        </span>
        <span className={cn('flex items-center gap-1 text-xs', theme.accentClass)}>
          <span className="opacity-70">{t('itemCount', { count: itemCount })}</span>
          <ChevronRight size={15} />
        </span>
      </button>
    </div>
  );
}
