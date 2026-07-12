'use client';

import dayjs from 'dayjs';
import { Wallet, Pencil } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

type CashflowBaselineCardProps = {
  /** 최초 현금 + (기준일~오늘 실거래 누적) = 오늘 기준 예상 잔액. 카드의 큰 숫자. */
  todayBalance: number;
  /** 사용자가 설정한 최초 현금(기준일 시점의 보유 현금). */
  initialCash: number;
  /** 최초 현금 기준일. */
  initialDate: Date | null;
  /** 탭하면 최초 현금 설정 시트를 연다. */
  onEdit: () => void;
};

/**
 * 현금흐름 예측의 출발점인 "오늘 예상 잔액"을 페이지 상단에 크게 노출하는 히어로 카드.
 * - 큰 숫자 = 최초 현금 + 기준일 이후 기록된 실제 거래를 더해 자동 계산한 오늘 잔액.
 * - 최초 현금과 기준일을 함께 보여줘, 이 값이 어디서 시작됐는지 분명히 한다.
 * - 탭하면 최초 현금 설정 시트로 이동(기어 아이콘에 숨어 있던 편집 진입점을 끌어올린다).
 */
export function CashflowBaselineCard({
  todayBalance,
  initialCash,
  initialDate,
  onEdit,
}: CashflowBaselineCardProps) {
  return (
    <button
      type="button"
      onClick={onEdit}
      data-testid="cashflow-baseline-card"
      aria-label="최초 현금 수정"
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/40"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-500"
        aria-hidden
      >
        <Wallet size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">오늘 기준 예상 현금</p>
        <p
          className="mt-0.5 text-xl font-bold tabular-nums text-foreground"
          data-testid="cashflow-baseline-amount"
        >
          {formatCurrency(todayBalance)}
        </p>
        <p
          className="mt-1 text-[11px] leading-snug text-muted-foreground"
          data-testid="cashflow-baseline-initial"
        >
          최초 현금 <span className="font-medium text-foreground">{formatCurrency(initialCash)}</span>
          {initialDate ? ` · ${dayjs(initialDate).format('YYYY.M.D')} 기준` : ''}에서 기록을 더해
          계산했어요.
        </p>
      </div>

      <span className="flex shrink-0 items-center gap-1 self-start rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
        <Pencil size={11} aria-hidden />
        수정
      </span>
    </button>
  );
}
