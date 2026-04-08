import dayjs from 'dayjs';
import { Skeleton } from '@uandi/ui';
import { formatAmount } from '@uandi/cashbook-core';
import type { CashbookCategory } from '@uandi/cashbook-core';
import type { CashbookEntry } from '@uandi/cashbook-core';
import type { GroupedEntries } from '@/hooks/useCashbook';
import { CategoryIcon } from './CategoryIcon';

type EntryListProps = {
  groupedEntries: GroupedEntries[];
  categories: CashbookCategory[] | undefined;
  isLoading: boolean;
  onEntryClick?: (entry: CashbookEntry) => void;
};

export function EntryList({ groupedEntries, categories, isLoading, onEntryClick }: EntryListProps) {
  const categoryMap = new Map(categories?.map((c) => [c.name, c]) ?? []);

  if (isLoading) {
    return (
      <div className="space-y-3 px-4 py-3">
        <Skeleton className="h-[108px] rounded-xl" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    );
  }

  if (groupedEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        내역이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groupedEntries.map((group) => (
        <div key={group.date}>
          <div className="mb-2 text-xs font-medium text-muted-foreground px-1">
            {dayjs(group.date).format('M월 D일 (ddd)')}
          </div>
          <div className="space-y-2">
            {group.entries.map((entry) => {
              const cat = categoryMap.get(entry.category);
              const icon = cat?.icon ?? '';
              const color = cat?.color ?? '#78909C';

              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onEntryClick?.(entry)}
                  className="flex w-full items-center gap-3 rounded-xl bg-card border border-border p-3 text-left hover:bg-accent/50 transition-colors cursor-pointer"
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
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.description}
                      </p>
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
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
