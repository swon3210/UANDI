'use client';

import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/stores/auth.store';
import { usePredictionRetro } from '@/hooks/usePredictionRetro';
import {
  useConfirmPrediction,
  useRejectPrediction,
  useDismissPrompt,
} from '@/hooks/usePredictions';
import { PredictionRetroBanner, type RetroItemView } from './PredictionRetroBanner';

export function PredictionRetroBannerHost() {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;

  const { items, dismiss } = usePredictionRetro(coupleId);
  const confirmMutation = useConfirmPrediction(coupleId);
  const rejectMutation = useRejectPrediction(coupleId);
  const dismissPromptMutation = useDismissPrompt(coupleId);

  const byId = useMemo(() => new Map(items.map((p) => [p.id, p])), [items]);

  if (items.length === 0) return null;

  const views: RetroItemView[] = items.map((p) => ({
    id: p.id,
    type: p.type,
    amount: p.amount,
    category: p.category,
    date: p.date.toDate(),
  }));

  const handleConfirm = (v: RetroItemView) => {
    const p = byId.get(v.id);
    if (p) confirmMutation.mutate({ prediction: p });
  };

  // calendar 출처는 프롬프트만 닫고, auto 출처는 거절(SYNC-04와 동일).
  const handleReject = (v: RetroItemView) => {
    const p = byId.get(v.id);
    if (!p) return;
    if (p.source === 'calendar') dismissPromptMutation.mutate(p.id);
    else rejectMutation.mutate(p.id);
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 pt-2">
      <PredictionRetroBanner
        items={views}
        onConfirm={handleConfirm}
        onReject={handleReject}
        onDismiss={dismiss}
      />
    </div>
  );
}
