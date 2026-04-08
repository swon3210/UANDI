import { cn } from '@uandi/ui';
import { CATEGORY_ICON_MAP, ICON_PRESET_KEYS } from './CategoryIcon';

type IconPickerProps = {
  value: string;
  onChange: (icon: string) => void;
};

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {ICON_PRESET_KEYS.map((key) => {
        const Icon = CATEGORY_ICON_MAP[key];
        return (
          <button
            key={key}
            type="button"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
              value === key
                ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                : 'bg-secondary hover:bg-accent'
            )}
            onClick={() => onChange(key)}
          >
            <Icon size={20} weight={value === key ? 'fill' : 'duotone'} />
          </button>
        );
      })}
    </div>
  );
}
