import { RefreshCcw, Sparkles } from 'lucide-react';
import { Button, Skeleton } from '@uandi/ui';
import type { ForexOutlook } from '@uandi/investment-core';
import { BuyRecommendationBadge } from './BuyRecommendationBadge';

type Props = {
  outlook: ForexOutlook | undefined;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
};

export function ForecastCard({ outlook, isLoading, error, onRefresh }: Props) {
  return (
    <div
      data-testid="forecast-card"
      className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-card-foreground"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-amber-700">
          <Sparkles size={14} className="text-amber-500" />
          AI 전망
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          data-testid="forecast-refresh"
          className="h-7 gap-1 px-2 text-xs text-amber-700 hover:bg-amber-100 hover:text-amber-800"
        >
          <RefreshCcw size={12} />
          다시 분석
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      )}

      {!isLoading && error && (
        <p data-testid="forecast-error" className="text-sm text-muted-foreground">
          {error}
        </p>
      )}

      {!isLoading && !error && outlook && (
        <>
          <BuyRecommendationBadge recommendation={outlook.recommendation} className="self-start" />
          <p className="text-sm leading-relaxed text-foreground/90">{outlook.summary}</p>
          <p className="text-xs text-muted-foreground">
            신뢰도 {(outlook.confidence * 100).toFixed(0)}%
          </p>
        </>
      )}
    </div>
  );
}
