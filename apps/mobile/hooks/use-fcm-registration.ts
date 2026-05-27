import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import {
  requestPermissionAndGetToken,
  subscribeTokenChange,
  type FcmTokenInfo,
} from '@/lib/fcm';

type Options = {
  onNotificationTap: (clickAction: string | null) => void;
};

export function useFcmRegistration({ onNotificationTap }: Options): FcmTokenInfo | null {
  const [tokenInfo, setTokenInfo] = useState<FcmTokenInfo | null>(null);

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

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | { click_action?: unknown }
        | undefined;
      const clickAction =
        data && typeof data.click_action === 'string' ? data.click_action : null;
      onNotificationTap(clickAction);
    });
    return () => sub.remove();
  }, [onNotificationTap]);

  return tokenInfo;
}
