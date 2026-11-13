import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger } from '@uandi/ui';
import type { PeriodKind } from '@/utils/date';

type Props = {
  value: PeriodKind;
  onChange: (value: PeriodKind) => void;
};

const OPTIONS: PeriodKind[] = ['monthly', 'yearly'];

export function PeriodSelector({ value, onChange }: Props) {
  const t = useTranslations('dashboard.period');
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as PeriodKind)}
      data-testid="period-selector"
    >
      <TabsList className="grid w-full grid-cols-2">
        {OPTIONS.map((opt) => (
          <TabsTrigger key={opt} value={opt}>
            {t(opt)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
