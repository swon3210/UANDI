import { useCallback, useState } from 'react';
import { AppWebView } from '@/components/app-webview';
import { useFcmRegistration } from '@/hooks/use-fcm-registration';

export default function HomeScreen() {
  const [pendingDeeplink, setPendingDeeplink] = useState<string | null>(null);

  const handleNotificationTap = useCallback((clickAction: string | null) => {
    if (clickAction) setPendingDeeplink(clickAction);
  }, []);

  const handleDeeplinkConsumed = useCallback(() => {
    setPendingDeeplink(null);
  }, []);

  const tokenInfo = useFcmRegistration({ onNotificationTap: handleNotificationTap });

  return (
    <AppWebView
      path="/"
      tokenInfo={tokenInfo}
      pendingDeeplink={pendingDeeplink}
      onDeeplinkConsumed={handleDeeplinkConsumed}
    />
  );
}
