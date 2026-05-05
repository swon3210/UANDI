import { Check } from 'lucide-react';
import { cn } from '@uandi/ui';

export type CategoryOption = {
  name: string;
  color: string;
};

type Props = {
  options: CategoryOption[];
  selected: string[];
  onToggle: (name: string) => void;
  max?: number;
};

export function CategorySelector({ options, selected, onToggle, max = 5 }: Props) {
  const reachedMax = selected.length >= max;

  if (options.length === 0) {
    return null;
  }

  return (
    <div data-testid="category-selector" className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>비교할 카테고리</span>
        <span>
          {selected.length} / {max}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.name);
          const isDisabled = !isSelected && reachedMax;

          return (
            <button
              key={opt.name}
              type="button"
              onClick={() => onToggle(opt.name)}
              disabled={isDisabled}
              data-testid={`category-chip-${opt.name}`}
              data-state={isSelected ? 'selected' : 'unselected'}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-40',
                isSelected
                  ? 'border-transparent bg-foreground text-background'
                  : 'border-border bg-card text-foreground hover:bg-accent'
              )}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: opt.color }}
              />
              <span>{opt.name}</span>
              {isSelected ? <Check size={12} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
