'use client';

import { cn } from '@uandi/ui';
import type { CategoryGroup } from '@/types';

type Props = {
  /** 지금까지의 실제 금액 (단색 구간) */
  actual: number;
  /** 아직 기록되지 않은 예정 금액 (빗금 구간) */
  upcoming: number;
  /** 막대 길이 100%에 해당하는 금액. 여러 막대를 같은 축에 둘 때 공통 최대값을 넘긴다 */
  max: number;
  tone: CategoryGroup;
  /** data-testid 접두어. `{prefix}-actual`, `{prefix}-upcoming` 구간에 붙는다 */
  testId?: string;
  className?: string;
};

const SOLID: Record<CategoryGroup, string> = {
  expense: 'bg-expense',
  income: 'bg-income',
};

/** 예정 구간 빗금. 같은 계열 색을 반투명 사선으로 깔아 "아직 아닌 금액"으로 읽히게 한다. */
export const HATCH_STYLE: Record<CategoryGroup, React.CSSProperties> = {
  expense: {
    backgroundImage:
      'repeating-linear-gradient(135deg, hsl(var(--expense) / 0.6) 0 3px, transparent 3px 7px)',
  },
  income: {
    backgroundImage:
      'repeating-linear-gradient(135deg, hsl(var(--income) / 0.6) 0 3px, transparent 3px 7px)',
  },
};

/**
 * 실제(단색) + 예정(빗금)을 한 줄에 이어 그리는 가로 막대.
 * 두 구간 사이 2px 틈으로 경계를 살리고, 금액이 0인 구간은 그리지 않는다.
 */
export function ActualProjectedBar({ actual, upcoming, max, tone, testId, className }: Props) {
  const safeMax = max > 0 ? max : 1;
  const actualPct = Math.min(actual / safeMax, 1) * 100;
  const upcomingPct = Math.min(upcoming / safeMax, 1 - actualPct / 100) * 100;

  return (
    <div
      data-testid={testId}
      className={cn('flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted', className)}
      aria-hidden
    >
      {actual > 0 ? (
        <div
          data-testid={testId ? `${testId}-actual` : undefined}
          className={cn('h-full rounded-full transition-[width]', SOLID[tone])}
          style={{ width: `${actualPct}%` }}
        />
      ) : null}
      {upcoming > 0 ? (
        <div
          data-testid={testId ? `${testId}-upcoming` : undefined}
          className="h-full rounded-full transition-[width]"
          style={{ width: `${upcomingPct}%`, ...HATCH_STYLE[tone] }}
        />
      ) : null}
    </div>
  );
}
