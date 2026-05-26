'use client';

import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/stores/auth.store';
import { upsertFcmToken } from '@/services/fcm-token';
import type { FcmTokenPlatform } from '@/types';

type NativeBridge = {
  fcmToken?: string;
  platform?: FcmTokenPlatform;
  userAgent?: string;
};

declare global {
  interface Window {
    __UANDI_NATIVE__?: NativeBridge;
  }
}

// WebView를 감싼 모바일 native 앱이 window.__UANDI_NATIVE__로 FCM 토큰을 주입한다.
// 인증된 웹 컨텍스트에서 기존 upsertFcmToken을 호출해 동일한 Firestore 경로에 저장한다.
export function NativeFcmBridge(): null {
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const flush = async () => {
      const bridge = window.__UANDI_NATIVE__;
      const token = bridge?.fcmToken;
      if (!token) return;
      try {
        await upsertFcmToken(
          uid,
          token,
          bridge?.userAgent ?? 'UANDI-Mobile',
          bridge?.platform
        );
      } catch (e) {
        console.warn('[NativeFcmBridge] upsert failed', e);
      }
    };

    void flush();

    const onReady = () => {
      if (cancelled) return;
      void flush();
    };
    window.addEventListener('uandi:native-ready', onReady);
    return () => {
      cancelled = true;
      window.removeEventListener('uandi:native-ready', onReady);
    };
  }, [uid]);

  return null;
}
