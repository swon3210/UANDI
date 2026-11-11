'use client';

import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { isAdminHost } from '@/lib/admin/admin-host';
import { getClientPlatform } from '@/lib/native';
import { recordClientPlatform } from '@/services/user';
import { userAtom } from '@/stores/auth.store';

/**
 * 로그인 사용자가 어느 플랫폼(web/android/ios)에서 앱을 열었는지 users/{uid}.clientPlatforms 에 남긴다.
 * 푸시 토큰과 달리 알림 동의와 무관하게 기록된다(docs/pages/06-admin.md). 어드민 도메인 방문은 제외.
 */
export function ClientPlatformTracker(): null {
  const uid = useAtomValue(userAtom)?.uid ?? null;

  useEffect(() => {
    if (!uid || isAdminHost(window.location.host)) return;
    recordClientPlatform(uid, getClientPlatform()).catch(() => {});
  }, [uid]);

  return null;
}
