'use client';

import { formatDay } from '@/utils/date';
import type { CashbookEntry, CashbookCategory, User } from '@/types';
import type { GroupedEntries } from '@/hooks/useCashbook';
import { EntryCard } from './EntryCard';

type EntryListProps = {
  groups: GroupedEntries[];
  categories: CashbookCategory[];
  onEntryClick: (entry: CashbookEntry) => void;
  /** 날짜 헤더 노출 여부. 금액순 등 평면 목록일 땐 false(카드에 날짜 표기). */
  showDateHeaders?: boolean;
  /** uid → 멤버. 전달되면 각 카드에 작성자 아바타를 표시한다. */
  members?: Map<string, User>;
};

export function EntryList({
  groups,
  categories,
  onEntryClick,
  showDateHeaders = true,
  members,
}: EntryListProps) {
  const categoryMap = new Map(categories.map((c) => [c.name, c]));

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.date.toISOString()}>
          {showDateHeaders && (
            <div className="mb-2 text-xs font-medium text-muted-foreground px-1">
              {formatDay(group.date)}
            </div>
          )}
          <div className="space-y-2">
            {group.entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                category={categoryMap.get(entry.category)}
                onClick={onEntryClick}
                showDate={!showDateHeaders}
                author={members?.get(entry.createdBy)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
