'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, SheetContent, SheetHeader, SheetTitle } from '@uandi/ui';
import type { StockHoldingInput } from '@/types';
import { formatCurrency } from '@/utils/currency';

type StockImportSheetProps = {
  holdings: StockHoldingInput[];
  onSave: (holdings: StockHoldingInput[]) => void;
  onClose: () => void;
};

/** 잔고 캡처에서 읽은 종목 미리보기 — 뺄 종목을 제외하고 일괄 저장한다. */
export function StockImportSheet({ holdings, onSave, onClose }: StockImportSheetProps) {
  const [items, setItems] = useState(holdings);

  return (
    <SheetContent
      side="bottom"
      className="max-h-[90vh] rounded-t-[20px] p-0"
      data-testid="stock-import-sheet"
    >
      <SheetHeader className="border-b border-border px-4 py-3 text-left">
        <SheetTitle className="text-base">캡처에서 찾은 종목 {items.length}개</SheetTitle>
        <p className="text-xs text-muted-foreground">
          저장 후 종목을 눌러 코드·수량을 고칠 수 있어요.
        </p>
      </SheetHeader>

      <ul className="max-h-[55vh] divide-y divide-border overflow-y-auto px-4">
        {items.map((h, i) => (
          <li
            key={`${h.name}-${i}`}
            className="flex items-center gap-3 py-3"
            data-testid="stock-import-item"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {h.name}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {h.symbol || '코드 없음'}
                </span>
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {h.quantity.toLocaleString('ko-KR')}주 · 평단{' '}
                {h.currency === 'USD'
                  ? `$${h.averagePrice.toLocaleString('en-US')}`
                  : formatCurrency(h.averagePrice)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${h.name} 제외`}
              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 border-t border-border px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))]">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          취소
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={items.length === 0}
          data-testid="stock-import-save"
          onClick={() => {
            onSave(items);
            onClose();
          }}
        >
          {items.length}개 저장
        </Button>
      </div>
    </SheetContent>
  );
}
