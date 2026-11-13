'use client';

import { useTranslations } from 'next-intl';
import { formatCurrencyMan } from '@/utils/currency';

type GoalsHeroCardProps = {
  totalIncome: number;
  totalExpense: number;
};

export function GoalsHeroCard({ totalIncome, totalExpense }: GoalsHeroCardProps) {
  const t = useTranslations('cashbook.goals');
  const tDash = useTranslations('dashboard');
  const won = (amount: string) => tDash('won', { amount });
  const net = totalIncome - totalExpense;

  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-coral-400 to-coral-500 p-5 text-white shadow-[0_6px_24px_hsl(4_74%_69%/0.3)]"
      data-testid="goals-hero-card"
    >
      <div className="text-[13px] opacity-85">{t('expectedSurplus')}</div>
      <div
        className="mt-1 text-[26px] font-extrabold leading-tight tabular-nums"
        data-testid="hero-net-amount"
      >
        {net >= 0 ? '+' : ''}
        {won(formatCurrencyMan(net))}
      </div>

      <div className="my-3.5 h-px bg-white/20" />

      <div className="flex justify-between">
        <HeroBreakdown label={t('incomeGoal')} value={totalIncome} sign="+" />
        <HeroBreakdown label={t('expenseLimit')} value={totalExpense} sign="-" />
      </div>
    </div>
  );
}

function HeroBreakdown({ label, value, sign }: { label: string; value: number; sign: '+' | '-' }) {
  return (
    <div className="text-center">
      <div className="text-[11px] opacity-70">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold tabular-nums">
        {sign}
        {formatCurrencyMan(value)}
      </div>
    </div>
  );
}
