import { useCallback, useState } from 'react';
import { AppWebView, type PendingDeeplink } from '@/components/app-webview';
import { useFcmRegistration } from '@/hooks/use-fcm-registration';
import { useDeepLink } from '@/hooks/use-deep-link';
import { useFloatingBubble } from '@/hooks/use-floating-bubble';

export default function HomeScreen() {
  const [pendingDeeplink, setPendingDeeplink] = useState<PendingDeeplink | null>(null);

  // FCM 알림 탭: 목적지로 직행한다.
  const handleNotificationTap = useCallback((clickAction: string | null) => {
    if (clickAction) setPendingDeeplink({ path: clickAction, viaDashboard: false });
  }, []);

  // 커스텀 스킴 딥링크: 대시보드를 거쳐 목적지로 이동한다.
  const handleDeeplink = useCallback((path: string) => {
    setPendingDeeplink({ path, viaDashboard: true });
  }, []);

  const handleDeeplinkConsumed = useCallback(() => {
    setPendingDeeplink(null);
  }, []);

  const tokenInfo = useFcmRegistration({ onNotificationTap: handleNotificationTap });
  useDeepLink(handleDeeplink);
  // 다른 앱 위에 떠 있는 MOA 플로팅 버블(앱이 백그라운드일 때 표시, 탭하면 그 자리에서 빠른 추가 패널 확장).
  useFloatingBubble();

  return (
    <AppWebView
      path="/"
      tokenInfo={tokenInfo}
      pendingDeeplink={pendingDeeplink}
      onDeeplinkConsumed={handleDeeplinkConsumed}
    />
  );
}
