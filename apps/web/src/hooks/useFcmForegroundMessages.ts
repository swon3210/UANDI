'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { onMessage } from 'firebase/messaging';
import { userAtom } from '@/stores/auth.store';
import { getMessagingIfSupported } from '@/lib/firebase/config';
import { useNotificationSettings } from './useNotificationSettings';
import { showForegroundFcmToast } from '@/lib/fcm/foreground-toast';

// FCM onMessage 구독 — 앱이 포그라운드일 때는 SW의 onBackgroundMessage가 발동하지
// 않으므로 in-app toast로 직접 알림을 띄운다. 외부 시스템 구독이라 useEffect 사용.
export function useFcmForegroundMessages(): void {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;
  const { data: settings } = useNotificationSettings(uid);
  const selfAlertInApp = settings?.budgetWarning?.selfAlertInApp ?? true;

  useEffect(() => {
    if (!uid) return;
    if (typeof window === 'undefined') return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const messaging = await getMessagingIfSupported();
      if (!messaging || cancelled) return;
      unsubscribe = onMessage(messaging, (payload) => {
        showForegroundFcmToast(payload, {
          selfAlertEnabled: selfAlertInApp,
          onAction: (clickAction) => router.push(clickAction),
        });
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [uid, selfAlertInApp, router]);
}
