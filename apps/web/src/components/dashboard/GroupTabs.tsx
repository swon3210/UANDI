import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@uandi/ui';
import type { GroupFilter } from '@/hooks/useDashboardData';

type Props = {
  value: GroupFilter;
  onChange: (value: GroupFilter) => void;
};

const OPTIONS: GroupFilter[] = ['all', 'expense', 'income'];

export function GroupTabs({ value, onChange }: Props) {
  const t = useTranslations('dashboard.group');
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as GroupFilter)} data-testid="group-tabs">
      <TabsList className="grid w-full grid-cols-3">
        {OPTIONS.map((opt) => (
          <TabsTrigger key={opt} value={opt} className="text-xs">
            {t(opt)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
