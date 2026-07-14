'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { setMyCoupleMessage, subscribeToCouplePresence, touchPresence } from '@/services/presence';
import type { CouplePresenceDoc } from '@/types';

/** 이 시간 안에 lastSeen이 갱신됐으면 "접속 중"으로 본다. */
export const PRESENCE_ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
/** 화면이 보이는 동안 하트비트 주기. */
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
/** staleness 재평가(오프라인 전환 감지)용 틱 주기. */
const PRESENCE_TICK_MS = 30 * 1000;

/**
 * 화면이 보이는 동안 주기적으로 내 lastSeen을 갱신하는 하트비트.
 * 브라우저 타이머/가시성 이벤트에 붙는 외부 시스템 동기화이므로 useEffect를 사용한다.
 */
export function usePresenceHeartbeat(coupleId: string | null, uid: string | null) {
  useEffect(() => {
    if (!coupleId || !uid) return;

    const beat = () => {
      if (document.visibilityState === 'visible') {
        void touchPresence(coupleId, uid);
      }
    };

    beat(); // 최초 1회
    const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener('visibilitychange', beat);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', beat);
    };
  }, [coupleId, uid]);
}

/**
 * 커플 presence 실시간 구독 + staleness 재평가용 시계.
 * 상대가 오프라인으로 바뀌어도 write가 발생하지 않으므로, nowMs를 주기적으로 갱신해
 * 소비 측이 "접속 중 → 오프라인" 전환을 다시 계산할 수 있게 한다.
 */
export function useCouplePresence(coupleId: string | null): {
  presence: CouplePresenceDoc;
  nowMs: number;
} {
  const [presence, setPresence] = useState<CouplePresenceDoc>({});
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!coupleId) return;
    const unsubscribe = subscribeToCouplePresence(coupleId, setPresence);
    return unsubscribe;
  }, [coupleId]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), PRESENCE_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return { presence, nowMs };
}

/**
 * 내 한마디 저장. presence는 onSnapshot으로 실시간 반영되므로 쿼리 무효화는 필요 없다.
 */
export function useSetCoupleMessage(coupleId: string | null, uid: string | null) {
  return useMutation({
    mutationFn: (message: string) => setMyCoupleMessage(coupleId!, uid!, message),
    onSuccess: () => {
      toast.success('한마디를 남겼어요 🐹');
    },
    onError: () => {
      toast.error('저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
    },
  });
}
