'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Plus,
  CreditCard,
  Landmark,
  Home,
  CalendarClock,
  CalendarRange,
  type LucideIcon,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Button, cn } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';
import { CashflowTransactionRow } from './CashflowTransactionRow';
import type { CashflowCardData } from '@/utils/cashflow';
import type { CashflowPaydayType } from '@/types';

type CashflowCardProps = {
  card: CashflowCardData;
  defaultOpen?: boolean;
  /** 있으면 펼친 카드 하단에 "예측 추가" 버튼을 노출(SYNC-02). */
  onAddPrediction?: () => void;
  /** 있으면 예측 거래 행에 삭제 버튼을 노출(SYNC-05). */
  onDeletePrediction?: (txnId: string) => void;
};

const TYPE_META: Record<CashflowPaydayType, { Icon: LucideIcon; tint: string }> = {
  card: { Icon: CreditCard, tint: 'bg-coral-100 text-coral-600' },
  loan: { Icon: Landmark, tint: 'bg-amber-100 text-amber-700' },
  rent: { Icon: Home, tint: 'bg-violet-100 text-violet-600' },
  custom: { Icon: CalendarClock, tint: 'bg-stone-200 text-stone-600' },
};
const WEEK_META = { Icon: CalendarRange, tint: 'bg-stone-200 text-stone-600' };

/** 결제일 카드(§4-3): 결제일·남는 돈을 강조하고, 들어올/나갈 돈을 2열로, 펼치면 거래 목록. */
export function CashflowCard({
  card,
  defaultOpen = false,
  onAddPrediction,
  onDeletePrediction,
}: CashflowCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { Icon, tint } = card.paydayType ? TYPE_META[card.paydayType] : WEEK_META;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      data-testid="cashflow-card"
      data-negative={card.isNegative}
    >
      <div
        className={cn(
          'overflow-hidden rounded-xl border bg-card shadow-sm',
          card.isNegative ? 'border-expense/40' : 'border-border'
        )}
      >
        <CollapsibleTrigger className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/40">
          <span
            className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tint)}
            aria-hidden
          >
            <Icon size={20} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{card.label}</p>
            {card.subLabel && (
              <p className="mt-0.5 text-xs text-muted-foreground">{card.subLabel}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <div className="text-right">
              <p className="text-[11px] leading-none text-muted-foreground">남는 돈</p>
              <p
                data-testid="cashflow-card-balance"
                className={cn(
                  'mt-1 text-lg font-bold leading-none tabular-nums',
                  card.isNegative ? 'text-expense' : 'text-foreground'
                )}
              >
                {formatCurrency(card.balance)}
              </p>
            </div>
            <ChevronDown
              size={18}
              className={cn(
                'shrink-0 text-muted-foreground transition-transform',
                open && 'rotate-180'
              )}
              aria-hidden
            />
          </div>
        </CollapsibleTrigger>

        {/* 들어올 / 나갈 돈 — 2열 */}
        <div className="grid grid-cols-2 border-t border-border/60 text-sm">
          <div className="flex items-center justify-center gap-1.5 border-r border-border/60 py-2.5">
            <span className="text-xs text-muted-foreground">들어올</span>
            <span className="font-semibold tabular-nums text-income">
              {card.inflow > 0 ? '+' : ''}
              {formatCurrency(card.inflow)}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 py-2.5">
            <span className="text-xs text-muted-foreground">나갈</span>
            <span className="font-semibold tabular-nums text-expense">
              {card.outflow > 0 ? '-' : ''}
              {formatCurrency(card.outflow)}
            </span>
          </div>
        </div>

        <CollapsibleContent>
          <div className="space-y-2 border-t border-border bg-muted/20 px-4 py-3">
            {card.estimatedVariable != null && card.estimatedVariable > 0 && (
              <div
                className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                data-testid="cashflow-card-estimated-variable"
              >
                <span className="text-muted-foreground">예상 변동지출</span>
                <span className="tabular-nums text-muted-foreground">
                  -{formatCurrency(card.estimatedVariable)}
                </span>
              </div>
            )}

            {card.transactions.length === 0 ? (
              <p className="py-1 text-sm text-muted-foreground">이 결제일에 잡힌 거래가 없어요</p>
            ) : (
              <div className="space-y-0.5">
                {card.transactions.map((t) => (
                  <CashflowTransactionRow
                    key={t.id}
                    txn={t}
                    onDelete={
                      onDeletePrediction && t.kind === 'predicted'
                        ? () => onDeletePrediction(t.id)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

            {onAddPrediction && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onAddPrediction}
                data-testid="cashflow-add-prediction"
              >
                <Plus size={14} className="mr-1" />
                예측 추가
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
