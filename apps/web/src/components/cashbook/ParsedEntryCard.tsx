'use client';

import { AlertTriangle, X } from 'lucide-react';
import { GROUP_LABELS } from '@uandi/cashbook-core';
import type { CashbookEntryType } from '@/types';
import { formatAmount } from '@/utils/currency';

export type ParsedEntryCardData = {
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  date: string;
  confidence: number;
};

type ParsedEntryCardProps = {
  entry: ParsedEntryCardData;
  onClick: () => void;
  onRemove: () => void;
};

export function ParsedEntryCard({ entry, onClick, onRemove }: ParsedEntryCardProps) {
  const lowConfidence = entry.confidence < 0.7;

  return (
    <div
      data-testid="parsed-entry-card"
      className={`group relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        lowConfidence
          ? 'border-amber-400/60 bg-amber-50/40 dark:bg-amber-500/5'
          : 'border-border bg-card'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-center gap-3 min-w-0 text-left"
      >
        <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
          {GROUP_LABELS[entry.type]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{entry.category}</span>
            {lowConfidence && (
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
          }`}
        >
          {formatAmount(entry.amount, entry.type)}
        </span>
      </button>
      <button
        type="button"
        data-testid="parsed-entry-remove"
        aria-label="항목 삭제"
        onClick={onRemove}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X size={16} />
      </button>
    </div>
  );
}
