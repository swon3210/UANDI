'use client';

import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { userAtom } from '@/stores/auth.store';
import { markAnnouncementSeen } from '@/services/user';

/**
 * 마지막으로 본 공지 id를 users 문서에 남기고 userAtom에도 바로 반영한다.
 * 저장 실패는 조용히 넘긴다 — 다음 진입에 공지가 한 번 더 뜰 뿐이다.
 */
export function useMarkAnnouncementSeen() {
  const setUser = useSetAtom(userAtom);

  return useCallback(
    (uid: string, announcementId: string) => {
      setUser((prev) =>
        prev && prev.uid === uid ? { ...prev, lastSeenAnnouncementId: announcementId } : prev
      );
      markAnnouncementSeen(uid, announcementId).catch((e) => {
        console.warn('[announcements] 읽음 기록 실패:', e);
      });
    },
    [setUser]
  );
}
