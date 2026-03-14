'use client';

import { X } from 'lucide-react';
import { Button } from '@uandi/ui';

type SelectionModeBarProps = {
  selectedCount: number;
  onClose: () => void;
  onMove: () => void;
};

export function SelectionModeBar({ selectedCount, onClose, onMove }: SelectionModeBarProps) {
  return (
    <header
      className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background px-2"
      data-testid="selection-bar"
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="선택 모드 닫기"
          data-testid="exit-select-mode"
        >
          <X size={20} />
        </Button>
        <span className="text-base font-medium" data-testid="selection-count">
          {selectedCount}장 선택
        </span>
      </div>
      <Button
        variant="default"
        size="sm"
        disabled={selectedCount === 0}
        onClick={onMove}
        data-testid="move-photos-btn"
      >
        이동
      </Button>
    </header>
  );
}
