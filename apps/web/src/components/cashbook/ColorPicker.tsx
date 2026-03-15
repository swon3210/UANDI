'use client';

import { cn } from '@uandi/ui';
import { COLOR_PRESETS } from '@/constants/default-categories';

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {COLOR_PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          data-testid={`color-option-${color}`}
          className={cn(
            'h-8 w-8 rounded-full transition-transform',
            value === color && 'ring-2 ring-foreground ring-offset-2 scale-110'
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
