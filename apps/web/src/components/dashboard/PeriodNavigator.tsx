import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@uandi/ui';

type Props = {
  label: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** 라벨 클릭 시 기간 직접 선택 UI를 연다 */
  onLabelClick?: () => void;
};

export function PeriodNavigator({ label, canGoNext, onPrev, onNext, onLabelClick }: Props) {
  const t = useTranslations('dashboard.period');
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
        aria-label={t('prev')}
      >
        <ChevronLeft size={18} />
      </Button>
      <Button
        variant="ghost"
        onClick={onLabelClick}
        disabled={!onLabelClick}
        data-testid="period-nav-label"
        aria-label={t('pickLabel', { label })}
        className="flex-1 text-sm font-medium disabled:opacity-100"
      >
        {label}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!canGoNext}
        data-testid="period-next"
        aria-label={t('next')}
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}
