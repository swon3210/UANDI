'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { respondToNudge, subscribeToReceivedNudge } from '@/services/nudge';
import type { Nudge, NudgeStatus } from '@/types';

/**
 * 짝꿍이 나에게 보낸 가장 최근의 `pending` 콕 찌르기를 실시간으로 구독한다
 * (Firestore onSnapshot = 외부 시스템 구독). 없으면 null.
 * 응답(seen/dismissed)하면 구독이 비워 주므로 별도 상태 관리가 필요 없다.
 */
export function useReceivedNudge(coupleId: string | null, uid: string | null): Nudge | null {
  const [nudge, setNudge] = useState<Nudge | null>(null);

  useEffect(() => {
    if (!coupleId || !uid) return;
    return subscribeToReceivedNudge(coupleId, uid, setNudge);
  }, [coupleId, uid]);

  return nudge;
}

/** 받은 콕 찌르기에 응답(seen / dismissed)한다. */
export function useRespondToNudge(coupleId: string | null) {
  return useMutation({
    mutationFn: ({
      nudgeId,
      status,
    }: {
      nudgeId: string;
      status: Exclude<NudgeStatus, 'pending'>;
    }) => respondToNudge(coupleId!, nudgeId, status),
    onError: () => {
      toast.error('잠시 후 다시 시도해 주세요.');
    },
  });
}
