'use client';

import { Wallet, Pencil } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

type CashflowBaselineCardProps = {
  /** 예측의 시작점이 되는 기준 현금(설정값). */
  amount: number;
  /** 탭하면 시작 현금 설정 시트를 연다. */
  onEdit: () => void;
};

/**
 * 현금흐름 예측의 "시작 현금"을 페이지 상단에 크게 노출하는 히어로 카드.
 * - 설정 아이콘(기어)에만 숨어 있던 편집 진입점을 눈에 띄게 끌어올린다.
 * - "현재 보유 현금"이 아니라 예측이 시작되는 기준점임을 라벨·설명으로 분명히 한다.
 */
export function CashflowBaselineCard({ amount, onEdit }: CashflowBaselineCardProps) {
  return (
    <button
      type="button"
      onClick={onEdit}
      data-testid="cashflow-baseline-card"
      aria-label="시작 현금 수정"
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/40"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-500"
        aria-hidden
      >
        <Wallet size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">시작 현금 · 오늘 기준</p>
        <p
          className="mt-0.5 text-xl font-bold tabular-nums text-foreground"
          data-testid="cashflow-baseline-amount"
        >
          {formatCurrency(amount)}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          이 금액에서 시작해 앞으로의 현금흐름을 예측해요. 실제 잔액이 달라지면 눌러서 맞춰주세요.
        </p>
      </div>

      <span className="flex shrink-0 items-center gap-1 self-start rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
        <Pencil size={11} aria-hidden />
        수정
      </span>
    </button>
  );
}
