'use client';

import { CreditCard, Landmark } from 'lucide-react';
import { cn } from '@uandi/ui';
import type { ImportSource } from './import-types';

const OPTIONS: { value: ImportSource; label: string; Icon: typeof Landmark; hint: string }[] = [
  {
    value: 'card',
    label: '카드 내역',
    Icon: CreditCard,
    hint: '카드 사용 내역 화면이나 이용내역서 PDF를 올려요',
  },
  {
    value: 'account',
    label: '통장 내역',
    Icon: Landmark,
    hint: '카드대금 일괄출금은 빼고, 송금은 따로 표시해 드려요',
  },
];

type ImportSourcePickerProps = {
  value: ImportSource;
  onChange: (value: ImportSource) => void;
  className?: string;
};

/** 통장/카드 선택 — 선택값은 파싱 요청의 imageKind가 된다. 선택별 안내 한 줄을 아래에 보여준다. */
export function ImportSourcePicker({ value, onChange, className }: ImportSourcePickerProps) {
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];
  return (
    <div className={cn('space-y-2', className)}>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="내역 종류">
        {OPTIONS.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              data-testid={`import-source-${o.value}`}
              onClick={() => onChange(o.value)}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent/50'
              )}
            >
              <o.Icon size={18} aria-hidden />
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground" data-testid="import-source-hint">
        {current.hint}
      </p>
    </div>
  );
}
