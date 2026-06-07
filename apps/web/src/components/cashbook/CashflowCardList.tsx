'use client';

import { CalendarRange } from 'lucide-react';
import { EmptyState } from '@uandi/ui';
import { CashflowCard } from './CashflowCard';
import type { CashflowCardData } from '@/utils/cashflow';

type CashflowCardListProps = {
  cards: CashflowCardData[];
  onAddPrediction?: (card: CashflowCardData) => void;
  onDeletePrediction?: (txnId: string) => void;
};

/** 다음 결제일부터 시간순으로 쌓인 카드 목록(§4-3). 첫 카드는 펼친 상태로 시작. */
export function CashflowCardList({
  cards,
  onAddPrediction,
  onDeletePrediction,
}: CashflowCardListProps) {
  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange size={48} className="text-muted-foreground" />}
        title="표시할 결제일이 없어요"
        description="결제일과 현재 보유 현금을 설정하면 현금흐름이 보여요"
      />
    );
  }

  return (
    <div className="space-y-3" data-testid="cashflow-card-list">
      {cards.map((card, i) => (
        <CashflowCard
          key={card.key}
          card={card}
          defaultOpen={i === 0}
          onAddPrediction={onAddPrediction ? () => onAddPrediction(card) : undefined}
          onDeletePrediction={onDeletePrediction}
        />
      ))}
    </div>
  );
}
