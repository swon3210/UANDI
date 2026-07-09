'use client';

import { Check, Trash2 } from 'lucide-react';
import { Button, cn } from '@uandi/ui';
import { formatAmount } from '@/utils/currency';
import type { CashflowTransaction } from '@/utils/cashflow';

type CashflowTransactionRowProps = {
  txn: CashflowTransaction;
  /** 예측 거래에 한해 삭제 버튼 노출(SYNC-05). */
  onDelete?: () => void;
};

/**
 * 예측 거래가 "어떻게" 나왔는지 근거를 만든다.
 * - 정기 발생(recurrence-): 사용자가 등록한 주기 → "정기 발생 · 격월 25일"
 * - AI 추론(llm-): 과거 패턴 추정 → "AI 추론 · 최근 3개월 평균 32만원"
 * - 그 외(레거시 수동 예측): "예측"
 */
function predictionBasis(txn: CashflowTransaction): string {
  const detail = txn.description?.trim();
  if (txn.id.startsWith('recurrence-')) return detail ? `정기 발생 · ${detail}` : '정기 발생';
  if (txn.source === 'llm' || txn.id.startsWith('llm-')) {
    return detail ? `AI 추론 · ${detail}` : 'AI 추론';
  }
  return detail ? `예측 · ${detail}` : '예측';
}

/** 캘린더 카드 펼침 시 거래 1건. 확정(✓ 채움)/예측(◇ 점선) 마커 + 예측 근거 표기. */
export function CashflowTransactionRow({ txn, onDelete }: CashflowTransactionRowProps) {
  const isPredicted = txn.kind === 'predicted';
  // 예측은 근거를 서브라벨로 옮겨 노출하므로 카테고리 줄에는 설명을 붙이지 않는다.
  // 실거래(확정)는 사용자가 적은 설명을 그대로 카테고리 줄에 유지한다.
  const sublabel = isPredicted ? predictionBasis(txn) : '확정';
  const showDescriptionInline = !isPredicted && !!txn.description;

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
          {showDescriptionInline && (
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
