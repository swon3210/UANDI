import dayjs from 'dayjs';
import { Loader2 } from 'lucide-react';
import { formatAmount } from '@uandi/cashbook-core';
import type { GroupedEntries } from '@/hooks/useCashbook';

type EntryListProps = {
  groupedEntries: GroupedEntries[];
  isLoading: boolean;
};

export function EntryList({ groupedEntries, isLoading }: EntryListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
    <>
      {groupedEntries.map((group) => (
        <div key={group.date}>
          <div className="px-3 py-1.5 bg-muted/50 text-xs text-muted-foreground sticky top-0">
            {dayjs(group.date).format('M월 D일 (ddd)')}
          </div>
          {group.entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{entry.category}</p>
                {entry.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.description}
                  </p>
                )}
              </div>
              <span
                className={`text-sm font-medium shrink-0 ml-2 ${
                  entry.type === 'income'
                    ? 'text-[hsl(var(--income))]'
                    : 'text-destructive'
                }`}
              >
                {formatAmount(entry.amount, entry.type)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
