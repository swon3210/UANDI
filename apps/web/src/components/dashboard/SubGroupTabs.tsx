import { Tabs, TabsList, TabsTrigger, cn } from '@uandi/ui';
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
      {/* 그룹 탭의 하위 필터라 탭 바 대신 작은 칩으로 표시해 위계를 구분한다 */}
      <TabsList className="h-auto w-full justify-start gap-1.5 bg-transparent p-0">
        {options.map((opt) => (
          <TabsTrigger
            key={opt.value}
            value={opt.value}
            className={cn(
              'h-8 rounded-full border border-border bg-card px-3.5 py-0 text-xs font-medium text-muted-foreground',
              'data-[state=active]:border data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary'
            )}
          >
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
