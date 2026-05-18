import { cn } from '@uandi/ui';
import { FOREX_RANGES, type ForexRange } from '@uandi/investment-core';

type Props = {
  value: ForexRange;
  onChange: (range: ForexRange) => void;
};

const LABEL: Record<ForexRange, string> = {
  '1w': '1주',
  '1m': '1개월',
  '3m': '3개월',
  '6m': '6개월',
  '1y': '1년',
  '5y': '5년',
};

export function TimeRangeSelector({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      data-testid="time-range-selector"
      className="inline-flex items-center gap-0.5 rounded-full bg-muted/60 p-1"
    >
      {FOREX_RANGES.map((range) => {
        const isActive = range === value;
        return (
          <button
            key={range}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-testid={`time-range-${range}`}
            onClick={() => onChange(range)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              isActive
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {LABEL[range]}
          </button>
        );
      })}
    </div>
  );
}
