'use client';

import { formatCurrencyMan } from '@/utils/currency';

type GoalsHeroCardProps = {
  totalIncome: number;
  totalExpense: number;
  investmentAllocated: number;
  flexTotal: number;
};

export function GoalsHeroCard({
  totalIncome,
  totalExpense,
  investmentAllocated,
  flexTotal,
}: GoalsHeroCardProps) {
  const net = totalIncome - totalExpense - investmentAllocated - flexTotal;

  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-coral-400 to-coral-500 p-5 text-white shadow-[0_6px_24px_hsl(4_74%_69%/0.3)]"
      data-testid="goals-hero-card"
    >
      <div className="text-[13px] opacity-85">예상 연간 순수익</div>
      <div
        className="mt-1 text-[26px] font-extrabold leading-tight tabular-nums"
        data-testid="hero-net-amount"
      >
        {net >= 0 ? '+' : ''}
        {formatCurrencyMan(net)}원
      </div>

      <div className="my-3.5 h-px bg-white/20" />

      <div className="flex justify-between">
        <HeroBreakdown label="수입 목표" value={totalIncome} sign="+" />
        <HeroBreakdown label="지출 한도" value={totalExpense} sign="-" />
        <HeroBreakdown label="투자 목표" value={investmentAllocated} sign="-" />
        <HeroBreakdown label="Flex 한도" value={flexTotal} sign="-" />
      </div>
    </div>
  );
}

function HeroBreakdown({
  label,
  value,
  sign,
}: {
  label: string;
  value: number;
  sign: '+' | '-';
}) {
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
