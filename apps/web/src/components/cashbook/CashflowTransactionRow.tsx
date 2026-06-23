'use client';

import { Check, Trash2 } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import { formatAmount } from '@/utils/currency';
import type { CashflowTransaction } from '@/utils/cashflow';

const SOURCE_LABEL: Record<NonNullable<CashflowTransaction['source']>, string> = {
  calendar: '캘린더',
  auto: '자동감지',
  llm: 'AI 예측',
};

type CashflowTransactionRowProps = {
  txn: CashflowTransaction;
  /** 예측 거래에 한해 삭제 버튼 노출(SYNC-05). */
  onDelete?: () => void;
};

/** 캘린더 카드 펼침 시 거래 1건. 확정(✓ 채움)/예측(◇ 점선) 마커 + 출처 표기. */
export function CashflowTransactionRow({ txn, onDelete }: CashflowTransactionRowProps) {
  const isPredicted = txn.kind === 'predicted';
  const sublabel = isPredicted
    ? txn.source
      ? `${SOURCE_LABEL[txn.source]} · 예측`
      : '예측'
    : '확정';

  return (
    <div
      data-testid="cashflow-txn-row"
      data-kind={txn.kind}
      className="flex items-center gap-2.5 py-2"
    >
      <span
        data-testid={`cashflow-txn-badge-${txn.kind}`}
        aria-hidden
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold leading-none',
          isPredicted
            ? 'border border-dashed border-coral-300 text-coral-500'
            : 'bg-sage-100 text-sage-600'
        )}
      >
        {isPredicted ? '◇' : <Check size={13} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {txn.category}
          {txn.description && (
            <span className="font-normal text-muted-foreground"> · {txn.description}</span>
          )}
        </p>
        <p className="text-[11px] text-muted-foreground">{sublabel}</p>
      </div>

      <span
        className={cn(
          'shrink-0 text-sm font-semibold tabular-nums',
          txn.type === 'income' ? 'text-income' : 'text-expense'
        )}
      >
        {formatAmount(txn.amount, txn.type)}
      </span>

      {isPredicted && onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground"
          onClick={onDelete}
          aria-label="예측 삭제"
          data-testid="cashflow-prediction-delete"
        >
          <Trash2 size={13} />
        </Button>
      )}
    </div>
  );
}
