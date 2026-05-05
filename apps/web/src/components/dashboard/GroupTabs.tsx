import { Tabs, TabsList, TabsTrigger } from '@uandi/ui';
import type { GroupFilter } from '@/hooks/useDashboardData';

type Props = {
  value: GroupFilter;
  onChange: (value: GroupFilter) => void;
};

const OPTIONS: Array<{ value: GroupFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'expense', label: '지출' },
  { value: 'income', label: '수입' },
  { value: 'flex', label: 'FLEX' },
  { value: 'investment', label: '투자' },
];

export function GroupTabs({ value, onChange }: Props) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as GroupFilter)}
      data-testid="group-tabs"
    >
      <TabsList className="grid w-full grid-cols-5">
        {OPTIONS.map((opt) => (
          <TabsTrigger key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
