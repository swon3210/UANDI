'use client';

import Link from 'next/link';
import { Target, X } from 'lucide-react';
import { Button, cn } from '@uandi/ui';

type AnnualPlanPromptCardProps = {
  year: number;
  /** 위저드 인트로 경로 */
  href: string;
  onDismiss: () => void;
  className?: string;
};

/**
 * 올해 예산 권유 카드 — 연간 플랜이 없을 때 대시보드 상단에 보인다.
 * 위저드로 강제 이동하는 대신 "세울래요?"로 권하고, 닫으면 30일 뒤 다시 보인다(소비 측이 기록).
 */
export function AnnualPlanPromptCard({
  year,
  href,
  onDismiss,
  className,
}: AnnualPlanPromptCardProps) {
  return (
    <div
      data-testid="annual-plan-prompt"
      className={cn(
        'relative rounded-2xl border border-coral-200 bg-gradient-to-br from-coral-50 to-card p-4 pr-10',
        className
      )}
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="예산 권유 닫기"
        data-testid="annual-plan-prompt-dismiss"
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X size={16} aria-hidden />
      </button>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Target size={20} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">
            올해 예산 세우기{' '}
            <span className="text-xs font-normal text-muted-foreground">· 약 5분</span>
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            {year}년 카테고리별 한 달 금액만 적으면 남는 돈이 보여요. 나중에 가계부 설정에서도 할 수
            있어요
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href={href} data-testid="annual-plan-prompt-start">
              시작하기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
