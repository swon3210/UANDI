'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ANNOUNCEMENTS } from '@/content/announcements';
import { openAnnouncementSheet } from '@/components/announcements/openAnnouncementSheet';
import { getUnreadAnnouncements } from '@/lib/announcements';
import { useAuth } from './useAuth';
import { TOUR_OPEN_DELAY_MS, TOUR_SEEN_KEY } from './useCashbookEntryAutoOpen';
import { useMarkAnnouncementSeen } from './useMarkAnnouncementSeen';

function isTourSeen() {
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * 대시보드 진입 시 안 읽은 공지 시트를 1회 연다(docs/pages/09-announcements.md).
 * - 온보딩 투어를 아직 안 본 방문이면 이번엔 열지 않는다(투어와 겹치지 않게). 판단은 화면당 한 번,
 *   투어가 seen을 기록하기 전(공지가 준비된 첫 시점)에 내려 둔다.
 * - 투어와 같은 지연 뒤에 열고, 열리는 순간 최신 공지 id를 읽음으로 기록한다.
 * users 문서·localStorage(외부 시스템) 상태에 반응하는 일회성 동작이라 effect + ref 가드를 쓴다.
 */
export function useAnnouncementAutoOpen() {
  const router = useRouter();
  const { user } = useAuth();
  const markSeen = useMarkAnnouncementSeen();
  const handledRef = useRef(false);
  const decisionRef = useRef<'open' | 'skip' | null>(null);

  const uid = user?.uid ?? null;
  const coupleId = user?.coupleId ?? null;
  const createdAt = user?.createdAt;
  const lastSeenAnnouncementId = user?.lastSeenAnnouncementId;
  const unread = useMemo(
    () =>
      createdAt ? getUnreadAnnouncements(ANNOUNCEMENTS, { createdAt, lastSeenAnnouncementId }) : [],
    [createdAt, lastSeenAnnouncementId]
  );

  useEffect(() => {
    if (!uid || !coupleId || handledRef.current || unread.length === 0) return;
    if (decisionRef.current === null) decisionRef.current = isTourSeen() ? 'open' : 'skip';
    if (decisionRef.current === 'skip') return;

    const timer = setTimeout(() => {
      if (handledRef.current) return;
      handledRef.current = true; // StrictMode 더블마운트 / 리렌더 가드
      markSeen(uid, unread[0].id); // 열리는 순간 기록 → 어떻게 닫아도 다시 뜨지 않는다
      openAnnouncementSheet({ announcements: unread, onNavigate: (href) => router.push(href) });
    }, TOUR_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [uid, coupleId, unread, markSeen, router]);
}
