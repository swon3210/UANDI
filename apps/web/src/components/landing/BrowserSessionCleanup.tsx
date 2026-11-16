'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, signOut } from '@/lib/firebase/auth';
import { isNativeApp } from '@/lib/native';

/**
 * 브라우저에 남아 있는 Firebase 세션을 지운다. 앱 설치 안내(/get-app)에서만 마운트한다.
 * 게이트가 생기기 전에 브라우저로 로그인한 사용자는 토큰이 IndexedDB 에 남아 있으므로,
 * 안내 페이지로 보내는 것만으로는 부족하고 로그아웃까지 해야 토큰이 지워진다.
 */
export function BrowserSessionCleanup(): null {
  useEffect(() => {
    if (isNativeApp()) return;
    return onAuthStateChanged((user) => {
      if (user) signOut().catch(() => {});
    });
  }, []);

  return null;
}
