'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@uandi/ui';
import type { BudgetThreshold } from '@/hooks/useMonthlyBudget';
import { josa } from '@/utils/josa';

export type BudgetAlert = {
  key: string; // localStorage dismiss key suffix: `${scopeId}-${threshold}`
  scope: 'category' | 'total';
  label: string;
  threshold: Exclude<BudgetThreshold, 'safe'>;
};

type BudgetAlertBannerProps = {
  alerts: BudgetAlert[];
  /** 배너가 대표하는 초과 알림을 한 번에 닫는다. */
  onDismissAll: () => void;
  /** "자세히 보기" 링크 대상. 생략 시 월간 페이지. */
  detailHref?: string;
};

// 상시 배너는 실제 초과(over100/over120)만 다룬다.
// 80% 임박(warn80)은 월간 노란 게이지 + 실시간 토스트가 담당한다.
type OverThreshold = 'over100' | 'over120';

const EMOJI: Record<OverThreshold, string> = {
  over100: '🔴',
  over120: '🚨',
};

function isOver(threshold: Exclude<BudgetThreshold, 'safe'>): threshold is OverThreshold {
  return threshold === 'over100' || threshold === 'over120';
}

function totalMessage(threshold: OverThreshold): string {
  const subject = josa('이번 달 전체 지출', '이/가');
  return threshold === 'over120'
    ? `${subject} 예산보다 20% 이상 초과됐어요`
    : `${subject} 예산을 넘었어요`;
}

export function BudgetAlertBanner({
  alerts,
  onDismissAll,
  detailHref = '/inner/cashbook/history/monthly',
}: BudgetAlertBannerProps) {
  const over = alerts.filter(
    (a): a is BudgetAlert & { threshold: OverThreshold } => isOver(a.threshold)
  );
  if (over.length === 0) return null;

  const totalOver = over.find((a) => a.scope === 'total') ?? null;
  const catOver = over.filter((a) => a.scope === 'category');

  const hasDanger = over.some((a) => a.threshold === 'over120');
  const catThreshold: OverThreshold = catOver.some((a) => a.threshold === 'over120')
    ? 'over120'
    : 'over100';

  return (
    <div
      data-testid="budget-alert-banner"
      role="alert"
      aria-live="polite"
      className={`rounded-lg px-3 py-2.5 text-red-900 ${hasDanger ? 'bg-red-100' : 'bg-red-50'}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1 text-sm leading-6">
          {totalOver && (
            <p className="font-medium">
              <span aria-hidden>{EMOJI[totalOver.threshold]} </span>
              {totalMessage(totalOver.threshold)}
            </p>
          )}
          {catOver.length > 0 && (
            <p>
              <span aria-hidden>{EMOJI[catThreshold]} </span>
              예산을 초과한 카테고리 {catOver.length}개
              <span aria-hidden> · </span>
              <Link
                href={detailHref}
                data-testid="budget-alert-detail-link"
                className="font-medium underline underline-offset-2"
              >
                자세히 보기
              </Link>
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-current hover:bg-black/5"
          onClick={onDismissAll}
          data-testid="budget-alert-dismiss-all"
          aria-label="예산 알림 모두 닫기"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
