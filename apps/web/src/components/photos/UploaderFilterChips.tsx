'use client';

import { Badge } from '@uandi/ui';
import { cn } from '@uandi/ui';

export type UploaderFilter = 'all' | 'me' | 'partner';

type UploaderFilterChipsProps = {
  value: UploaderFilter;
  onChange: (filter: UploaderFilter) => void;
};

const FILTERS: { key: UploaderFilter; label: string; testId: string }[] = [
  { key: 'all', label: '전체', testId: 'filter-all' },
  { key: 'me', label: '나', testId: 'filter-me' },
  { key: 'partner', label: '연인', testId: 'filter-partner' },
];

export function UploaderFilterChips({ value, onChange }: UploaderFilterChipsProps) {
  return (
    <div className="flex gap-2 px-4 py-2" data-testid="uploader-filter-chips">
      {FILTERS.map((f) => (
        <Badge
          key={f.key}
          variant={value === f.key ? 'default' : 'secondary'}
          className={cn(
            'cursor-pointer text-sm py-1.5 px-3 transition-colors',
            value === f.key && 'bg-primary text-primary-foreground'
          )}
          onClick={() => onChange(f.key)}
          data-testid={f.testId}
        >
          {f.label}
        </Badge>
      ))}
    </div>
  );
}
