'use client';

import { useTranslations } from 'next-intl';
import { CreditCard, Landmark } from 'lucide-react';
import { cn } from '@uandi/ui';
import type { ImportSource } from './import-types';

const OPTIONS: { value: ImportSource; Icon: typeof Landmark }[] = [
  { value: 'card', Icon: CreditCard },
  { value: 'account', Icon: Landmark },
];

type ImportSourcePickerProps = {
  value: ImportSource;
  onChange: (value: ImportSource) => void;
  className?: string;
};

/** 통장/카드 선택 — 선택값은 파싱 요청의 imageKind가 된다. 선택별 안내 한 줄을 아래에 보여준다. */
export function ImportSourcePicker({ value, onChange, className }: ImportSourcePickerProps) {
  const t = useTranslations('cashbook.import');
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];
  return (
    <div className={cn('space-y-2', className)}>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('sourceGroup')}>
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
              {t(`sources.${o.value}.label`)}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground" data-testid="import-source-hint">
        {t(`sources.${current.value}.hint`)}
      </p>
    </div>
  );
}
