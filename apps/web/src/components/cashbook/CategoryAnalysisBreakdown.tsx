'use client';

import { cn } from '@uandi/ui';
import type { CategoryGroup } from '@/types';
import { formatCurrency } from '@/utils/currency';

export type CategoryAnalysisBreakdownRow = {
  category: string;
  color: string;
  current: number;
  /** 비교 대상 금액. null이면 `—` */
  compare: number | null;
};

type Props = {
  rows: CategoryAnalysisBreakdownRow[];
  group: CategoryGroup;
  /** 비교 대상 라벨 (예: 평소, 9월) */
  compareLabel: string;
};

const INCREASE_IS_GOOD: Record<CategoryGroup, boolean> = { expense: false, income: true };

function DeltaCell({ row, group }: { row: CategoryAnalysisBreakdownRow; group: CategoryGroup }) {
  if (row.compare === null) return <span className="text-muted-foreground">—</span>;
  const delta = row.current - row.compare;
  if (delta === 0) return <span className="text-muted-foreground">변동 없음</span>;
  const good = delta > 0 === INCREASE_IS_GOOD[group];
  return (
    <span className={cn('tabular-nums', good ? 'text-income' : 'text-expense')}>
      {delta > 0 ? '▲' : '▼'} {formatCurrency(Math.abs(delta))}
    </span>
  );
}

/** 분석 범위 안 카테고리별 이번 달 vs 비교 대상 (한 줄씩, 증감 색은 기간 비교와 같은 규칙) */
export function CategoryAnalysisBreakdown({ rows, group, compareLabel }: Props) {
  return (
    <section data-testid="category-analysis-breakdown" className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>카테고리별 · {rows.length}개</span>
        <span>{compareLabel} → 이번 달</span>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li
            key={row.category}
            data-testid={`category-analysis-row-${row.category}`}
            className="flex items-center gap-2 py-2 text-sm"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{row.category}</span>
            <span className="flex shrink-0 flex-col items-end">
              <span className="font-semibold tabular-nums">{formatCurrency(row.current)}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {row.compare !== null ? formatCurrency(row.compare) : '—'} ·{' '}
                <DeltaCell row={row} group={group} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
