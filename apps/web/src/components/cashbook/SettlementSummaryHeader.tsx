'use client';

import { formatCurrency } from '@/utils/currency';

export type SettlementSummaryHeaderProps = {
  income: number;
  expense: number;
  flex: number;
};

type Tile = {
  label: string;
  value: number;
  prefix: string;
  className: string;
  testId: string;
};

/** 월 결산: 수입 · 지출 · FLEX 3지표를 한눈에 보여주는 헤더. */
export function SettlementSummaryHeader({ income, expense, flex }: SettlementSummaryHeaderProps) {
  const tiles: Tile[] = [
    {
      label: '수입',
      value: income,
      prefix: '+',
      className: 'text-income',
      testId: 'settlement-summary-income',
    },
    {
      label: '지출',
      value: expense,
      prefix: '-',
      className: 'text-expense',
      testId: 'settlement-summary-expense',
    },
    {
      label: 'FLEX',
      value: flex,
      prefix: '',
      className: 'text-[#6366f1]',
      testId: 'settlement-summary-flex',
    },
  ];

  return (
    <div
      className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-3"
      data-testid="settlement-summary-header"
    >
      {tiles.map((tile) => (
        <div key={tile.label} className="flex flex-col items-center gap-1" data-testid={tile.testId}>
          <span className="text-xs text-muted-foreground">{tile.label}</span>
          <span className={`text-sm font-bold tabular-nums ${tile.className}`}>
            {tile.value > 0 ? tile.prefix : ''}
            {formatCurrency(tile.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
