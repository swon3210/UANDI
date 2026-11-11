import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, cn } from '@uandi/ui';
import type { SubGroupFilter } from '@/hooks/useDashboardData';

type Props = {
  /** 고정/변동을 붙일 그룹 라벨 (지출 → 고정 지출 / 변동 지출) */
  groupLabel: string;
  value: SubGroupFilter;
  onChange: (value: SubGroupFilter) => void;
};

export function SubGroupTabs({ groupLabel, value, onChange }: Props) {
  const t = useTranslations('dashboard.subGroup');
  const options: Array<{ value: SubGroupFilter; label: string }> = [
    { value: 'all', label: t('all', { group: groupLabel }) },
    { value: 'fixed', label: t('fixed', { group: groupLabel }) },
    { value: 'variable', label: t('variable', { group: groupLabel }) },
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
