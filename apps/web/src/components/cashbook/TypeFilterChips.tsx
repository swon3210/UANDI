'use client';

import { Check } from 'lucide-react';
import { cn } from '@uandi/ui';
import type { CashbookEntryType } from '@/types';
import { TYPE_LABELS, TYPE_ORDER } from './entry-filter.utils';

type TypeFilterChipsProps = {
  /** 선택된 타입들. 빈 배열 = 전체(무필터). */
  value: CashbookEntryType[];
  onToggle: (type: CashbookEntryType) => void;
};

/**
 * 지출/수입/Flex 다중선택 칩. 선택된 칩은 강조 + 체크 표시.
 * 빈 배열이면 전체를 의미하므로 별도 '전체' 칩은 두지 않는다.
 */
export function TypeFilterChips({ value, onToggle }: TypeFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5" data-testid="filter-type-chips">
      {TYPE_ORDER.map((type) => {
        const selected = value.includes(type);
        return (
          <button
            key={type}
            type="button"
            data-testid={`filter-type-${type}`}
            aria-pressed={selected}
            onClick={() => onToggle(type)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-secondary text-foreground hover:bg-accent'
            )}
          >
            {TYPE_LABELS[type]}
            {selected && <Check size={14} aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
