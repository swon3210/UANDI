'use client';

import { CalendarClock } from 'lucide-react';
import { Badge } from '@uandi/ui';
import { formatRecurrence, type RecurringSchedule } from '@uandi/cashbook-core';

type RecurringBadgeProps = {
  schedule?: RecurringSchedule | null;
};

export function RecurringBadge({ schedule }: RecurringBadgeProps) {
  if (!schedule || !schedule.enabled) return null;

  return (
    <Badge
      variant="secondary"
      data-testid="category-recurrence-badge"
      className="gap-1 font-normal text-muted-foreground"
    >
      <CalendarClock size={12} />
      {formatRecurrence(schedule)}
    </Badge>
  );
}
