import { cn } from '@uandi/ui';
import { COLOR_PRESETS } from '@uandi/cashbook-core';

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            'h-7 w-7 rounded-full transition-transform',
            value === color && 'ring-2 ring-foreground ring-offset-2 scale-110'
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
