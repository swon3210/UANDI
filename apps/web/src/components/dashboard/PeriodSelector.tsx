import { Tabs, TabsList, TabsTrigger } from '@uandi/ui';
import type { PeriodKind } from '@/utils/date';

type Props = {
  value: PeriodKind;
  onChange: (value: PeriodKind) => void;
};

const OPTIONS: Array<{ value: PeriodKind; label: string }> = [
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
  { value: 'yearly', label: '연간' },
];

export function PeriodSelector({ value, onChange }: Props) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as PeriodKind)}
      data-testid="period-selector"
    >
      <TabsList className="grid w-full grid-cols-3">
        {OPTIONS.map((opt) => (
          <TabsTrigger key={opt.value} value={opt.value}>
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
