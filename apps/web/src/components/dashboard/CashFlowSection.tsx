'use client';

import { CashFlowChart, Skeleton } from '@uandi/ui';
import { useCashFlowForecast } from '@/hooks/useCashFlowForecast';

type Props = {
  coupleId: string;
};

export function CashFlowSection({ coupleId }: Props) {
  const { points, hasHistory, isLoading } = useCashFlowForecast(coupleId);

  if (isLoading) {
    return <Skeleton className="h-[260px] w-full rounded-xl" />;
  }

  // 이력이 전혀 없으면 평탄한 0 차트는 노이즈이므로 섹션을 숨긴다.
  if (!hasHistory) return null;

  return (
    <section
      data-testid="cashflow-section"
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <div>
        <h2 className="text-sm font-semibold">월별 순현금흐름 예측</h2>
        <p className="text-xs text-muted-foreground">최근 6개월 추이 기반 · 향후 3개월 예측</p>
      </div>
      <CashFlowChart data={points} />
    </section>
  );
}
