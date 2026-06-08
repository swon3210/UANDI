'use client';

import { X, TriangleAlert } from 'lucide-react';
import { Button } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';

type CashflowNegativeBannerProps = {
  /** 음수가 되는 결제일 라벨(예: "신한카드 결제"). */
  label: string;
  /** 해당 결제일 잔액(음수). */
  balance: number;
  /** 날짜 등 보조 표기(예: "6월 25일"). */
  subLabel?: string;
  onDismiss: () => void;
};

/** §10: 다음 결제일 잔액이 음수가 되면 앱 진입 시 상단 경고 배너. */
export function CashflowNegativeBanner({
  label,
  balance,
  subLabel,
  onDismiss,
}: CashflowNegativeBannerProps) {
  return (
    <div
      data-testid="cashflow-negative-banner"
      role="alert"
      aria-live="polite"
      className="flex items-start gap-3 rounded-xl border border-coral-200 bg-coral-50 p-3 text-coral-700"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-100 text-coral-600"
        aria-hidden
      >
        <TriangleAlert size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">잔액 부족 주의</p>
        <p className="mt-0.5 text-xs leading-5 text-coral-700/90">
          <span className="font-medium">{label}</span>
          {subLabel ? ` (${subLabel})` : ''}에 잔액이{' '}
          <span className="font-semibold tabular-nums">{formatCurrency(balance)}</span>으로 부족해요
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="-mr-1 -mt-1 h-7 w-7 shrink-0 text-current hover:bg-coral-100"
        onClick={onDismiss}
        aria-label="알림 닫기"
        data-testid="cashflow-negative-dismiss"
      >
        <X size={15} />
      </Button>
    </div>
  );
}
