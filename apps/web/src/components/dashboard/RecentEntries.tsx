'use client';

import { Skeleton, cn } from '@uandi/ui';
import { useMonthlyEntries } from '@/hooks/useCashbook';
import { formatAmount } from '@/utils/currency';

type RecentEntriesProps = {
  coupleId: string;
};

export function RecentEntries({ coupleId }: RecentEntriesProps) {
  const { data: entries, isLoading } = useMonthlyEntries(coupleId);
  const recentThree = entries?.slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!recentThree || recentThree.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {recentThree.map((entry) => (
        <div
          key={entry.id}
          data-testid="recent-entry"
          className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium">{entry.category}</p>
            {entry.description && (
              <p className="text-xs text-muted-foreground">{entry.description}</p>
            )}
          </div>
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              entry.type === 'income' ? 'text-income' : 'text-expense'
            )}
          >
            {formatAmount(entry.amount, entry.type)}
          </span>
        </div>
      ))}
    </div>
  );
}
