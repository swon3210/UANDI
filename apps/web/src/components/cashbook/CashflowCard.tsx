'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { ChevronDown, CalendarRange } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger, cn } from '@uandi/ui';
import { formatCurrency } from '@/utils/currency';
import { CashflowTransactionRow } from './CashflowTransactionRow';
import type { CashflowCardData, CashflowTransaction } from '@/utils/cashflow';

type CashflowCardProps = {
  card: CashflowCardData;
  defaultOpen?: boolean;
  /**
   * 있으면 예측 거래 행에 삭제 버튼을 노출(레거시 calendar 예측 doc 정리용).
   * 합성 예측(recurrence-/llm- prefix)은 doc이 없어 삭제 대상이 아니다.
   */
  onDeletePrediction?: (txnId: string) => void;
};

/** 합성 예측(읽기 시점 파생)이라 삭제할 doc이 없는지 — recurrence/llm 출처. */
function isSyntheticPrediction(txn: CashflowTransaction): boolean {
  return txn.id.startsWith('recurrence-') || txn.id.startsWith('llm-');
}

/** 펼친 카드 안 거래를 '실제 날짜'별로 묶는다(각 날짜를 분명히 보이게). */
function groupByDate(txns: CashflowTransaction[]): { key: string; date: Date; items: CashflowTransaction[] }[] {
  const map = new Map<string, { key: string; date: Date; items: CashflowTransaction[] }>();
  for (const t of txns) {
    const key = dayjs(t.date).format('YYYY-MM-DD');
    const g = map.get(key);
    if (g) g.items.push(t);
    else map.set(key, { key, date: t.date, items: [t] });
  }
  return [...map.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * 지출 예정일 카드(§4-3): 그 '날짜까지'의 남는 돈을 강조하는 현금 체크포인트.
 * 날짜를 큰 블록으로 끌어올려 어느 날 기준인지 한눈에 보이게 한다.
 */
export function CashflowCard({
  card,
  defaultOpen = false,
  onDeletePrediction,
}: CashflowCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  // 결제일 카드는 subLabel(단일 날짜)을 갖고, 주 단위 폴백은 갖지 않는다.
  // (paydayType은 리프레이밍으로 UI에서 제거돼 비어 있을 수 있으므로 기준으로 쓰지 않는다.)
  const isPayday = !!card.subLabel;

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
          {isPayday ? (
            <div
              className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-stone-100 leading-none"
              data-testid="cashflow-card-date"
              aria-hidden
            >
              <span className="text-[10px] font-medium text-stone-500">
                {dayjs(card.endDate).format('M')}월
              </span>
              <span className="text-xl font-bold leading-tight text-stone-800">
                {dayjs(card.endDate).format('D')}
              </span>
            </div>
          ) : (
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-200 text-stone-600"
              aria-hidden
            >
              <CalendarRange size={20} />
            </span>
          )}

          <div className="min-w-0 flex-1">
            {isPayday && card.subLabel ? (
              <>
                <p className="truncate text-sm font-semibold leading-tight text-foreground">
                  {card.subLabel}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{card.label}</p>
              </>
            ) : (
              <p className="truncate font-semibold leading-tight">{card.label}</p>
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
          <div className="space-y-3 border-t border-border bg-muted/20 px-4 py-3">
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
              <p className="py-1 text-sm text-muted-foreground">이 날짜까지 잡힌 거래가 없어요</p>
            ) : (
              groupByDate(card.transactions).map((g) => (
                <div key={g.key} data-testid="cashflow-day-group">
                  <p className="mb-1 border-b border-border/50 pb-1 text-xs font-semibold text-foreground/80">
                    {dayjs(g.date).format('M월 D일 (dd)')}
                  </p>
                  <div className="space-y-0.5">
                    {g.items.map((t) => (
                      <CashflowTransactionRow
                        key={t.id}
                        txn={t}
                        onDelete={
                          onDeletePrediction && t.kind === 'predicted' && !isSyntheticPrediction(t)
                            ? () => onDeletePrediction(t.id)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
