import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@uandi/ui';

type Props = {
  label: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function PeriodNavigator({ label, canGoNext, onPrev, onNext }: Props) {
  return (
    <div
      data-testid="period-navigator"
      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-2 py-1"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        data-testid="period-prev"
        aria-label="이전 기간"
      >
        <ChevronLeft size={18} />
      </Button>
      <span
        data-testid="period-nav-label"
        className="flex-1 text-center text-sm font-medium"
      >
        {label}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!canGoNext}
        data-testid="period-next"
        aria-label="다음 기간"
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}
