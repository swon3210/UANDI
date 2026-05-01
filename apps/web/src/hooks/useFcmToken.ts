'use client';

import { useCallback, useState } from 'react';
import { getToken } from 'firebase/messaging';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/stores/auth.store';
import { firebaseConfig, getMessagingIfSupported } from '@/lib/firebase/config';
import { upsertFcmToken } from '@/services/fcm-token';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type FcmEnableState =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'error';

function hasAllConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
  );
}

function buildSwUrl(): string {
  // service worker는 .env에 접근할 수 없으므로 쿼리 파라미터로 firebaseConfig를 전달
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey ?? '',
    authDomain: firebaseConfig.authDomain ?? '',
    projectId: firebaseConfig.projectId ?? '',
    storageBucket: firebaseConfig.storageBucket ?? '',
    messagingSenderId: firebaseConfig.messagingSenderId ?? '',
    appId: firebaseConfig.appId ?? '',
  });
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

export function useFcmToken() {
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;
  const [state, setState] = useState<FcmEnableState>('idle');
  const [token, setToken] = useState<string | null>(null);

  console.log({
    VAPID_KEY
  })

  const enable = useCallback(
    async (options: { skipPermissionPrompt?: boolean } = {}): Promise<FcmEnableState> => {
      if (!uid) return 'idle';
      if (typeof window === 'undefined') return 'idle';
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        setState('unsupported');
        return 'unsupported';
      }
      if (!VAPID_KEY || !hasAllConfig()) {
        setState('unsupported');
        return 'unsupported';
      }

      setState('requesting');

      let permission: NotificationPermission = Notification.permission;
      if (permission === 'default') {
        if (options.skipPermissionPrompt) {
          setState('idle');
          return 'idle';
        }
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') {
        setState('denied');
        return 'denied';
      }

      try {
        const messaging = await getMessagingIfSupported();
        if (!messaging) {
          setState('unsupported');
          return 'unsupported';
        }
        const registration = await navigator.serviceWorker.register(buildSwUrl(), { scope: '/' });
        const fcmToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!fcmToken) {
          setState('error');
          return 'error';
        }

        await upsertFcmToken(uid, fcmToken, navigator.userAgent);
        setToken(fcmToken);
        setState('granted');
        return 'granted';
      } catch {
        setState('error');
        return 'error';
      }
    },
    [uid]
  );

  return { state, token, enable };
}
