'use client';

import { useEffect, useRef } from 'react';
import { subscribeToCouple } from '@/services/couple';

type Options = {
  /** 구독을 켤지 — 짝꿍이 아직 없을 때만 켠다 */
  enabled: boolean;
  /** memberUids가 2명이 되는 순간 한 번 호출 (새로 들어온 짝꿍 uid) */
  onPartnerJoined: (partnerUid: string) => void;
};

/**
 * 짝꿍 합류를 실시간으로 감지한다 (Firestore onSnapshot = 외부 시스템 구독).
 * 대시보드 초대 카드가 새로고침 없이 연결 카드로 바뀌도록 쓴다.
 */
export function useCoupleConnection(
  coupleId: string | null,
  myUid: string | null,
  { enabled, onPartnerJoined }: Options
) {
  // 최신 콜백을 ref로 들고 있어 구독을 다시 걸지 않는다 (렌더 중 ref 쓰기 금지 → effect에서 동기화)
  const onJoinedRef = useRef(onPartnerJoined);
  useEffect(() => {
    onJoinedRef.current = onPartnerJoined;
  }, [onPartnerJoined]);

  useEffect(() => {
    if (!enabled || !coupleId || !myUid) return;

    let fired = false;
    const unsubscribe = subscribeToCouple(coupleId, (couple) => {
      if (fired || couple.memberUids.length < 2) return;
      const partnerUid = couple.memberUids.find((uid) => uid !== myUid);
      if (!partnerUid) return;
      fired = true;
      onJoinedRef.current(partnerUid);
    });

    return () => unsubscribe();
  }, [enabled, coupleId, myUid]);
}
