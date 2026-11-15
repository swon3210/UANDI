'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@uandi/ui';
import { cn } from '@uandi/ui';

export type UploaderFilter = 'all' | 'me' | 'partner';

type UploaderFilterChipsProps = {
  value: UploaderFilter;
  onChange: (filter: UploaderFilter) => void;
};

const FILTERS: { key: UploaderFilter; testId: string }[] = [
  { key: 'all', testId: 'filter-all' },
  { key: 'me', testId: 'filter-me' },
  { key: 'partner', testId: 'filter-partner' },
];

export function UploaderFilterChips({ value, onChange }: UploaderFilterChipsProps) {
  const t = useTranslations('photos');
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
          {t(`uploader.${f.key}`)}
        </Badge>
      ))}
    </div>
  );
}
