'use client';

import type { CashbookEntry, CashbookCategory } from '@/types';
import { formatAmount } from '@/utils/currency';
import { CategoryIcon } from './CategoryIcon';

type EntryCardProps = {
  entry: CashbookEntry;
  category?: CashbookCategory;
  onClick: (entry: CashbookEntry) => void;
};

export function EntryCard({ entry, category, onClick }: EntryCardProps) {
  const icon = category?.icon ?? '';
  const color = category?.color ?? '#78909C';

  return (
    <button
      type="button"
      data-testid={`entry-card-${entry.id}`}
      className="flex w-full items-center gap-3 rounded-xl bg-card border border-border p-3 text-left transition-colors hover:bg-accent"
      onClick={() => onClick(entry)}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: color + '20', color }}
      >
        <CategoryIcon name={icon} size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{entry.category}</span>
        {entry.description && (
          <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
        )}
      </div>
      <span
        className={`text-sm font-semibold tabular-nums shrink-0 ${
          entry.type === 'income' ? 'text-income' : 'text-expense'
        }`}
      >
        {formatAmount(entry.amount, entry.type)}
      </span>
    </button>
  );
}
