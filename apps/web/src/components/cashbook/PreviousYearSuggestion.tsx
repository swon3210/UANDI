'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';

type PreviousYearSuggestionProps = {
  categoryName: string;
  previousAmount: number;
  onApply: (amount: number) => void;
};

export function PreviousYearSuggestion({
  categoryName,
  previousAmount,
  onApply,
}: PreviousYearSuggestionProps) {
  const [rate, setRate] = useState(5);
  const suggestedAmount = Math.round(previousAmount * (1 + rate / 100));

  return (
    <div
      className="rounded-xl bg-accent/50 border border-border p-4 space-y-3"
      data-testid="previous-year-suggestion"
    >
      <div className="text-sm font-medium flex items-center gap-1">
        <span>💡</span>
        <span>전년도 기반 제안</span>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <div>
          전년도 {categoryName}: {formatCurrency(previousAmount)}
        </div>
        <div>
          올해 제안 (+{rate}%): {formatCurrency(suggestedAmount)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">증감률 조절:</span>
        <button
          type="button"
          data-testid="rate-decrease"
          className="h-6 w-6 rounded-md bg-secondary flex items-center justify-center hover:bg-accent"
          onClick={() => setRate((prev) => Math.max(-50, prev - 1))}
        >
          <Minus size={14} />
        </button>
        <span className="text-sm font-medium tabular-nums w-10 text-center">{rate}%</span>
        <button
          type="button"
          data-testid="rate-increase"
          className="h-6 w-6 rounded-md bg-secondary flex items-center justify-center hover:bg-accent"
          onClick={() => setRate((prev) => Math.min(100, prev + 1))}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => onApply(suggestedAmount)}>
          제안 적용
        </Button>
        <Button size="sm" variant="outline" onClick={() => onApply(previousAmount)}>
          직접 입력
        </Button>
      </div>
    </div>
  );
}
