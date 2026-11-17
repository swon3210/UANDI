import { useCallback, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import {
  getInitialNotification,
  getMessaging,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import { requestPermissionAndGetToken, subscribeTokenChange, type FcmTokenInfo } from '@/lib/fcm';

type Options = {
  onNotificationTap: (clickAction: string | null) => void;
};

/** 같은 알림 탭을 expo-notifications와 Firebase가 둘 다 알릴 수 있어, 이 시간 안의 같은 목적지는 한 번만 처리한다 */
const DUPLICATE_TAP_WINDOW_MS = 3000;

function clickActionOf(data: unknown): string | null {
  const value = (data as { click_action?: unknown } | undefined)?.click_action;
  return typeof value === 'string' ? value : null;
}

export function useFcmRegistration({ onNotificationTap }: Options): FcmTokenInfo | null {
  const [tokenInfo, setTokenInfo] = useState<FcmTokenInfo | null>(null);
  const lastTapRef = useRef<{ clickAction: string | null; at: number } | null>(null);
  const initialCheckedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    void requestPermissionAndGetToken().then((info) => {
      if (mounted && info) setTokenInfo(info);
    });
    const unsub = subscribeTokenChange((info) => {
      if (mounted) setTokenInfo(info);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const handleTap = useCallback(
    (clickAction: string | null) => {
      const now = Date.now();
      const last = lastTapRef.current;
      if (last && last.clickAction === clickAction && now - last.at < DUPLICATE_TAP_WINDOW_MS) {
        return;
      }
      lastTapRef.current = { clickAction, at: now };
      onNotificationTap(clickAction);
    },
    [onNotificationTap]
  );

  useEffect(() => {
    // expo-notifications가 띄운 알림(앱이 켜진 상태에서 받은 알림 등)을 탭했을 때
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleTap(clickActionOf(response.notification.request.content.data));
    });

    // FCM이 시스템 트레이에 띄운 알림을 탭했을 때.
    // 앱이 백그라운드에 살아 있으면 onNotificationOpenedApp, 꺼져 있다가 열리면 getInitialNotification으로 온다.
    // (expo 리스너만으로는 백그라운드 탭이 오지 않아 앱만 열리고 이동하지 않았다)
    const messaging = getMessaging();
    const unsubOpened = onNotificationOpenedApp(messaging, (message) => {
      handleTap(clickActionOf(message.data));
    });
    if (!initialCheckedRef.current) {
      initialCheckedRef.current = true;
      void getInitialNotification(messaging).then((message) => {
        if (message) handleTap(clickActionOf(message.data));
      });
    }

    return () => {
      sub.remove();
      unsubOpened();
    };
  }, [handleTap]);

  return tokenInfo;
}
