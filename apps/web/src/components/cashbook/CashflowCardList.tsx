'use client';

import { useTranslations } from 'next-intl';
import { CalendarRange } from 'lucide-react';
import { EmptyState } from '@uandi/ui';
import { CashflowCard } from './CashflowCard';
import type { CashflowCardData } from '@/utils/cashflow';

type CashflowCardListProps = {
  cards: CashflowCardData[];
  onDeletePrediction?: (txnId: string) => void;
};

/** 다음 결제일부터 시간순으로 쌓인 카드 목록(§4-3). 첫 카드는 펼친 상태로 시작. */
export function CashflowCardList({ cards, onDeletePrediction }: CashflowCardListProps) {
  const t = useTranslations('cashbook.cashflow.list');
  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange size={48} className="text-muted-foreground" />}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
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
          onDeletePrediction={onDeletePrediction}
        />
      ))}
    </div>
  );
}
