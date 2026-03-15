'use client';

import { cn } from '@uandi/ui';
import { ICON_PRESET_KEYS, CATEGORY_ICON_MAP } from '@/constants/category-icons';

type IconPickerProps = {
  value: string;
  onChange: (icon: string) => void;
};

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {ICON_PRESET_KEYS.map((key) => {
        const Icon = CATEGORY_ICON_MAP[key];
        return (
          <button
            key={key}
            type="button"
            data-testid={`icon-option-${key}`}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
              value === key
                ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                : 'bg-secondary hover:bg-accent'
            )}
            onClick={() => onChange(key)}
          >
            <Icon size={22} weight={value === key ? 'fill' : 'duotone'} />
          </button>
        );
      })}
    </div>
  );
}
