import { useTranslations } from 'next-intl';
import { cn } from '@uandi/ui';
import { FOREX_RANGES, type ForexRange } from '@uandi/investment-core';

type Props = {
  value: ForexRange;
  onChange: (range: ForexRange) => void;
};

export function TimeRangeSelector({ value, onChange }: Props) {
  const t = useTranslations('outer.forex.ranges');
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
            {t(range)}
          </button>
        );
      })}
    </div>
  );
}
