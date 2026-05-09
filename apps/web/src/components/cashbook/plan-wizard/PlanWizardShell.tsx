'use client';

import { ChevronLeft, X } from 'lucide-react';
import { Button, cn } from '@uandi/ui';

type PlanWizardShellProps = {
  title: string;
  subtitle?: string;
  /** 0..1 */
  progress: number;
  onPrev?: () => void;
  onNext?: () => void;
  onExit?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  /** 다음/이전 hide 여부 */
  hideFooter?: boolean;
  children: React.ReactNode;
};

export function PlanWizardShell({
  title,
  subtitle,
  progress,
  onPrev,
  onNext,
  onExit,
  prevDisabled,
  nextDisabled,
  nextLabel = '다음',
  prevLabel = '이전',
  hideFooter = false,
  children,
}: PlanWizardShellProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-3 py-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={prevDisabled || !onPrev}
            aria-label="이전"
            data-testid="wizard-back"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-stone-700',
              'transition-colors hover:bg-stone-100 disabled:opacity-30'
            )}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold text-stone-900">
              {title}
            </div>
            {subtitle && (
              <div className="truncate text-[11px] text-stone-500">{subtitle}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onExit}
            disabled={!onExit}
            aria-label="위저드 종료"
            data-testid="wizard-exit"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-stone-500',
              'transition-colors hover:bg-stone-100 disabled:opacity-30'
            )}
          >
            <X size={18} />
          </button>
        </div>
        <div
          className="h-1 w-full bg-stone-100"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          data-testid="wizard-progress"
        >
          <div
            className="h-full bg-coral-400 transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-5 pb-32">
        {children}
      </main>

      {!hideFooter && (
        <footer
          className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 backdrop-blur"
          data-testid="wizard-footer"
        >
          <div className="mx-auto flex w-full max-w-md items-center gap-2 px-4 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={onPrev}
              disabled={prevDisabled || !onPrev}
              className="min-w-[88px]"
              data-testid="wizard-prev"
            >
              {prevLabel}
            </Button>
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || !onNext}
              className="flex-1"
              data-testid="wizard-next"
            >
              {nextLabel}
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
