'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userAtom } from '@/stores/auth.store';
import { useCoupleMemberMap } from '@/hooks/useCoupleMembers';
import { subscribeToLatestEntry } from '@/services/cashbook';

const HISTORY_PATH = '/inner/cashbook/history';

/**
 * 짝꿍이 적은 내역을 같은 화면에 머물러도 바로 반영한다 (docs/pages/02-dashboard.md).
 * 기간 내역 쿼리 전체를 실시간으로 바꾸는 대신 **최신 내역 1건만** onSnapshot으로 구독하고,
 * 최신 문서가 바뀌면 내역 쿼리를 무효화해 TanStack Query가 그 자리에서 다시 읽게 한다.
 * - 내 쓰기(hasPendingWrites)와 내가 적은 내역은 뮤테이션이 이미 무효화하므로 무시한다.
 * - 짝꿍이 새로 적었을 때(createdAt이 이전 최신보다 뒤)만 토스트를 띄운다.
 */
export function CashbookLiveSync(): null {
  const user = useAtomValue(userAtom);
  const coupleId = user?.coupleId ?? null;
  const uid = user?.uid ?? null;
  const queryClient = useQueryClient();
  const router = useRouter();
  const memberMap = useCoupleMemberMap(coupleId);
  // 구독을 다시 걸지 않고 최신 멤버 정보를 읽기 위한 ref (렌더 중 ref 쓰기 금지 → effect에서 동기화)
  const memberMapRef = useRef(memberMap);
  useEffect(() => {
    memberMapRef.current = memberMap;
  }, [memberMap]);

  useEffect(() => {
    if (!coupleId || !uid) return;

    let initialized = false;
    let latestId: string | null = null;
    let latestCreatedMs = 0;

    const unsubscribe = subscribeToLatestEntry(coupleId, (latest, hasPendingWrites) => {
      if (hasPendingWrites) return;
      const id = latest?.id ?? null;
      const createdMs = latest?.createdAt?.toMillis?.() ?? 0;
      if (!initialized) {
        initialized = true;
        latestId = id;
        latestCreatedMs = createdMs;
        return;
      }
      if (id === latestId) return;
      const isNewer = createdMs > latestCreatedMs;
      latestId = id;
      latestCreatedMs = Math.max(latestCreatedMs, createdMs);

      // 최신 문서가 바뀌었다 = 누군가 적거나 지웠다 → 내역 쿼리를 다시 읽는다
      void queryClient.invalidateQueries({ queryKey: ['cashbookEntries', coupleId] });
      void queryClient.invalidateQueries({ queryKey: ['hasAnyEntries', coupleId] });

      if (!latest || !isNewer || latest.createdBy === uid) return;
      const name = memberMapRef.current.get(latest.createdBy)?.displayName?.trim() || '짝꿍';
      const onHistory = window.location.pathname.startsWith(HISTORY_PATH);
      toast(
        `${name}님이 내역을 적었어요`,
        onHistory
          ? undefined
          : { action: { label: '내역 보기', onClick: () => router.push(HISTORY_PATH) } }
      );
    });

    return unsubscribe;
  }, [coupleId, uid, queryClient, router]);

  return null;
}
