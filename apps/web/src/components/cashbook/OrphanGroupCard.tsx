'use client';

import { useState } from 'react';
import { Button } from '@uandi/ui';
import { Tag, Check } from 'lucide-react';
import dayjs from 'dayjs';
import type { CashbookEntry } from '@/types';
import { formatAmount } from '@/utils/currency';

type OrphanGroupCardProps = {
  name: string;
  entries: CashbookEntry[];
  onRemap: (selectedEntryIds: string[]) => void;
};

export function OrphanGroupCard({ name, entries, onRemap }: OrphanGroupCardProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => {
    const allSelected = entries.length > 0 && entries.every((e) => selectedIds.has(e.id));
    setSelectedIds(allSelected ? new Set() : new Set(entries.map((e) => e.id)));
  };

  const handleRemap = () => {
    const currentIds = entries.map((e) => e.id);
    const selectedCurrent = currentIds.filter((id) => selectedIds.has(id));
    const ids = selectedCurrent.length > 0 ? selectedCurrent : currentIds;
    setSelectedIds(new Set());
    onRemap(ids);
  };

  const allSelected = entries.length > 0 && entries.every((e) => selectedIds.has(e.id));
  const selectedCount = entries.filter((e) => selectedIds.has(e.id)).length;

  return (
    <div
      data-testid={`orphan-group-${name}`}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Tag size={16} className="shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {entries.length}건
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          data-testid="orphan-group-remap"
          onClick={handleRemap}
        >
          재매칭
        </Button>
      </div>

      <ul className="divide-y divide-border">
        {entries.map((entry) => {
          const checked = selectedIds.has(entry.id);
          return (
            <li key={entry.id}>
              <button
                type="button"
                data-testid={`orphan-entry-${entry.id}`}
                onClick={() => toggle(entry.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                  checked ? 'bg-accent/50' : ''
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background'
                  }`}
                >
                  {checked && <Check size={12} />}
                </span>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {dayjs(entry.date.toDate()).format('M/D')}
                  </span>
                  {entry.description && (
                    <span className="truncate text-sm">{entry.description}</span>
                  )}
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    entry.type === 'income' ? 'text-income' : 'text-expense'
                  }`}
                >
                  {formatAmount(entry.amount, entry.type)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between p-2">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          data-testid="orphan-group-select-all"
          onClick={toggleAll}
        >
          {allSelected ? '선택 해제' : '전체 선택'}
        </button>
        <span className="text-xs text-muted-foreground">
          {selectedCount > 0 ? `${selectedCount}건 선택` : '전체 적용'}
        </span>
      </div>
    </div>
  );
}
