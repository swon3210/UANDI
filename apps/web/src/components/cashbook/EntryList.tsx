'use client';

import { formatDay } from '@/utils/date';
import type { CashbookEntry, CashbookCategory } from '@/types';
import type { GroupedEntries } from '@/hooks/useCashbook';
import { EntryCard } from './EntryCard';

type EntryListProps = {
  groups: GroupedEntries[];
  categories: CashbookCategory[];
  onEntryClick: (entry: CashbookEntry) => void;
};

export function EntryList({ groups, categories, onEntryClick }: EntryListProps) {
  const categoryMap = new Map(categories.map((c) => [c.name, c]));

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.date.toISOString()}>
          <div className="mb-2 text-xs font-medium text-muted-foreground px-1">
            {formatDay(group.date)}
          </div>
          <div className="space-y-2">
            {group.entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                category={categoryMap.get(entry.category)}
                onClick={onEntryClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
