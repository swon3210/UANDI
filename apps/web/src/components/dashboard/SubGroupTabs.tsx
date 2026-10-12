import { Tabs, TabsList, TabsTrigger } from '@uandi/ui';
import type { SubGroupFilter } from '@/hooks/useDashboardData';

type Props = {
  /** 고정/변동을 붙일 그룹 라벨 (지출 → 고정 지출 / 변동 지출) */
  groupLabel: '지출' | '수입';
  value: SubGroupFilter;
  onChange: (value: SubGroupFilter) => void;
};

export function SubGroupTabs({ groupLabel, value, onChange }: Props) {
  const options: Array<{ value: SubGroupFilter; label: string }> = [
    { value: 'all', label: `전체 ${groupLabel}` },
    { value: 'fixed', label: `고정 ${groupLabel}` },
    { value: 'variable', label: `변동 ${groupLabel}` },
  ];

  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as SubGroupFilter)}
      data-testid="subgroup-tabs"
    >
      <TabsList className="grid h-8 w-full grid-cols-3">
        {options.map((opt) => (
          <TabsTrigger key={opt.value} value={opt.value} className="py-0.5 text-xs">
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
