import { cn } from '@uandi/ui';

export type ImportStepNumber = 1 | 2 | 3;

const STEP_LABELS: Record<ImportStepNumber, string> = {
  1: '올리기',
  2: '카테고리',
  3: '내역 확인',
};

type ImportStepIndicatorProps = {
  current: ImportStepNumber;
  className?: string;
};

/** 가져오기 3단계 표시. data-step 속성으로 현재 단계를 노출한다(E2E). */
export function ImportStepIndicator({ current, className }: ImportStepIndicatorProps) {
  return (
    <ol
      data-testid="import-step"
      data-step={current}
      aria-label={`${current}단계 ${STEP_LABELS[current]}`}
      className={cn('flex items-center gap-1.5', className)}
    >
      {([1, 2, 3] as ImportStepNumber[]).map((n) => {
        const done = n < current;
        const active = n === current;
        return (
          <li key={n} className="flex items-center gap-1.5">
            <span
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                active && 'bg-primary text-primary-foreground',
                done && 'bg-primary/20 text-primary',
                !active && !done && 'bg-muted text-muted-foreground'
              )}
            >
              {n}
            </span>
            {active ? (
              <span className="text-xs font-medium text-foreground">{STEP_LABELS[n]}</span>
            ) : null}
            {n < 3 ? <span aria-hidden className="h-px w-3 bg-border" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
