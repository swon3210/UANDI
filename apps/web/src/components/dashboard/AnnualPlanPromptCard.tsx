'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Target, X } from 'lucide-react';
import { Button, cn } from '@uandi/ui';

export type AnnualPlanPromptVariant = 'start' | 'resume';

type AnnualPlanPromptCardProps = {
  year: number;
  /** 위저드 경로. start면 인트로, resume면 마지막으로 머문 단계 */
  href: string;
  /** start: 플랜 없음 / resume: 플랜은 있는데 위저드를 끝내지 않음(리비전 0개) */
  variant?: AnnualPlanPromptVariant;
  /** resume일 때 "n개 항목을 적었어요"에 쓰는 진행 상황 */
  progress?: { done: number; total: number };
  /** 닫기. 생략하면 닫기 버튼이 없다(경제 목표 페이지 상단 배너). */
  onDismiss?: () => void;
  className?: string;
  'data-testid'?: string;
};

/**
 * 올해 예산 권유 카드 — 연간 플랜이 없을 때(start) 또는 위저드를 중간에 나갔을 때(resume)
 * 대시보드 상단에 보인다. 위저드로 강제 이동하는 대신 권하고, 닫으면 30일 뒤 다시 보인다(소비 측이 기록).
 */
export function AnnualPlanPromptCard({
  year,
  href,
  variant = 'start',
  progress,
  onDismiss,
  className,
  'data-testid': testId = 'annual-plan-prompt',
}: AnnualPlanPromptCardProps) {
  const t = useTranslations('dashboard.planPrompt');
  const isResume = variant === 'resume';
  const done = progress?.done ?? 0;

  return (
    <div
      data-testid={testId}
      data-variant={variant}
      className={cn(
        'relative rounded-2xl border border-coral-200 bg-gradient-to-br from-coral-50 to-card p-4',
        onDismiss && 'pr-10',
        className
      )}
    >
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('dismiss')}
          data-testid="annual-plan-prompt-dismiss"
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X size={16} aria-hidden />
        </button>
      ) : null}
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Target size={20} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {isResume ? (
            <>
              <p className="text-base font-semibold text-foreground">{t('resumeTitle')}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                {done > 0 ? t('resumeProgress', { done }) : t('resumeStarted')}
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href={href} data-testid="annual-plan-prompt-resume">
                  {t('resume')}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-foreground">
                {t('startTitle')}{' '}
                <span className="text-xs font-normal text-muted-foreground">{t('duration')}</span>
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                {t('startDescription', { year })}
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href={href} data-testid="annual-plan-prompt-start">
                  {t('start')}
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
