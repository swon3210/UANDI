'use client';

import { X } from 'lucide-react';
import { Button } from '@uandi/ui';
import type { BudgetThreshold } from '@/hooks/useMonthlyBudget';

export type BudgetAlert = {
  key: string; // localStorage dismiss key suffix: `${scopeId}-${threshold}`
  scope: 'category' | 'total';
  label: string;
  threshold: Exclude<BudgetThreshold, 'safe'>;
};

type BudgetAlertBannerProps = {
  alerts: BudgetAlert[];
  onDismiss: (key: string) => void;
};

const THRESHOLD_RANK: Record<Exclude<BudgetThreshold, 'safe'>, number> = {
  over120: 0,
  over100: 1,
  warn80: 2,
};

const THRESHOLD_STYLES: Record<
  Exclude<BudgetThreshold, 'safe'>,
  { emoji: string; bg: string; text: string }
> = {
  warn80: { emoji: '🟡', bg: 'bg-yellow-50', text: 'text-yellow-900' },
  over100: { emoji: '🔴', bg: 'bg-red-50', text: 'text-red-900' },
  over120: { emoji: '🚨', bg: 'bg-red-100', text: 'text-red-900' },
};

function alertMessage(alert: BudgetAlert): string {
  const subject = alert.scope === 'total' ? '이번 달 전체 지출' : `이번 달 ${alert.label}`;
  switch (alert.threshold) {
    case 'warn80':
      return `${subject}이 예산의 80%를 넘었어요`;
    case 'over100':
      return `${subject}이 예산을 넘었어요`;
    case 'over120':
      return `${alert.scope === 'total' ? '이번 달 전체 지출' : alert.label}이 예산보다 20% 이상 초과됐어요`;
  }
}

export function BudgetAlertBanner({ alerts, onDismiss }: BudgetAlertBannerProps) {
  if (alerts.length === 0) return null;

  const sorted = [...alerts].sort(
    (a, b) => THRESHOLD_RANK[a.threshold] - THRESHOLD_RANK[b.threshold]
  );

  return (
    <div
      data-testid="budget-alert-banner"
      className="space-y-2"
      role="alert"
      aria-live="polite"
    >
      {sorted.map((alert) => {
        const style = THRESHOLD_STYLES[alert.threshold];
        return (
          <div
            key={alert.key}
            data-testid={`budget-alert-item-${alert.key}`}
            className={`flex items-start gap-2 rounded-lg px-3 py-2 ${style.bg} ${style.text}`}
          >
            <span className="text-base leading-6" aria-hidden>
              {style.emoji}
            </span>
            <p className="flex-1 text-sm leading-6">{alertMessage(alert)}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-current hover:bg-black/5"
              onClick={() => onDismiss(alert.key)}
              data-testid={`budget-alert-dismiss-${alert.key}`}
              aria-label="알림 닫기"
            >
              <X size={14} />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
