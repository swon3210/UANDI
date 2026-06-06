'use client';

import { useMemo } from 'react';
import { useSsrSafeLocalStorage } from './useSsrSafeLocalStorage';
import { firstNegativeCard, type CashflowCardData } from '@/utils/cashflow';

export type CashflowNegativeAlert = {
  negativeCard: CashflowCardData | null;
  dismiss: () => void;
};

/**
 * §10: 다음(가장 이른) 결제일 잔액이 음수인 카드를 진입 시 배너로 노출.
 * dismiss는 카드 key 단위로 localStorage에 저장 → 같은 카드는 다시 안 뜨지만,
 * 잔액이 바뀌어 다른 카드가 음수가 되면 새로 알린다.
 */
export function useCashflowNegativeAlert(
  coupleId: string | null,
  cards: CashflowCardData[]
): CashflowNegativeAlert {
  const negative = useMemo(() => firstNegativeCard(cards), [cards]);

  const storageKey = `cashflow-negative-dismissed::${coupleId ?? '__none'}`;
  const [dismissedMap, setDismissedMap] = useSsrSafeLocalStorage<Record<string, boolean>>(
    storageKey,
    {}
  );

  const negativeCard = negative && !dismissedMap[negative.key] ? negative : null;

  const dismiss = () => {
    if (negative) setDismissedMap({ ...dismissedMap, [negative.key]: true });
  };

  return { negativeCard, dismiss };
}
