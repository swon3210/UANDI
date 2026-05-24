'use client';

import dayjs from 'dayjs';
import { AlertTriangle } from 'lucide-react';
import { Switch } from '@uandi/ui';
import { GROUP_LABELS } from '@uandi/cashbook-core';
import type { CashbookEntryType } from '@/types';
import { formatAmount } from '@/utils/currency';
import type { DuplicateMatch } from '@/utils/cashbook-duplicate';

export type ParsedEntryCardData = {
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  date: string;
  confidence: number;
  duplicate?: DuplicateMatch | null;
  selected: boolean;
};

type ParsedEntryCardProps = {
  entry: ParsedEntryCardData;
  onClick: () => void;
  onToggleSelected: (selected: boolean) => void;
};

export function ParsedEntryCard({
  entry,
  onClick,
  onToggleSelected,
}: ParsedEntryCardProps) {
  const lowConfidence = entry.confidence < 0.7;
  const isDuplicate = !!entry.duplicate;
  const isUnselected = !entry.selected;

  const borderClass = isDuplicate
    ? 'border-destructive/60 bg-destructive/5'
    : lowConfidence
      ? 'border-amber-400/60 bg-amber-50/40 dark:bg-amber-500/5'
      : 'border-border bg-card';

  return (
    <div
      data-testid="parsed-entry-card"
      data-duplicate={isDuplicate ? 'true' : 'false'}
      data-selected={entry.selected ? 'true' : 'false'}
      className={`group relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${borderClass}`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`flex flex-1 items-center gap-3 min-w-0 text-left transition-opacity ${
          isUnselected ? 'opacity-50' : ''
        }`}
      >
        <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
          {GROUP_LABELS[entry.type]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{entry.category}</span>
            {isDuplicate && (
              <span
                data-testid="parsed-entry-duplicate-badge"
                className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive"
              >
                중복 의심 · {dayjs(entry.duplicate!.existingDate).format('M/D')}
              </span>
            )}
            {!isDuplicate && lowConfidence && (
              <AlertTriangle
                size={14}
                className="shrink-0 text-amber-500"
                aria-label="낮은 신뢰도"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {entry.description || '메모 없음'} · {entry.date}
          </p>
        </div>
        <span
          className={`text-sm font-semibold tabular-nums shrink-0 ${
            entry.type === 'income' ? 'text-income' : 'text-expense'
          } ${isUnselected ? 'line-through' : ''}`}
        >
          {formatAmount(entry.amount, entry.type)}
        </span>
      </button>
      <Switch
        data-testid="parsed-entry-toggle"
        aria-label={entry.selected ? '추가에서 제외' : '추가에 포함'}
        checked={entry.selected}
        onCheckedChange={(v) => onToggleSelected(v)}
        className="shrink-0"
      />
    </div>
  );
}
