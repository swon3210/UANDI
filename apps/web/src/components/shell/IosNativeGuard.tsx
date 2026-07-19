'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isIosNative } from '@/lib/native';
import { MascotLoader } from '@/components/MascotLoader';

/**
 * iOS 네이티브(WebView) 안에서 가계부 외 기능 라우트(/inner/photos·/outer·/community)
 * 진입을 막는 클라이언트 가드. iOS면 /inner/cashbook 으로 리다이렉트한다.
 *
 * middleware.ts(서버)는 네이티브 브리지(window.__UANDI_NATIVE__)를 볼 수 없으므로,
 * 각 공간 layout 의 클라이언트 컴포넌트에서 가드한다. Android/웹 브라우저는 통과.
 *
 * platform 은 페이지 로드 전에 주입되지만(app-webview.tsx), 지연 주입/재주입 경로도
 * 있으므로 uandi:native-ready 이벤트에도 다시 확인한다(외부 시스템 동기화 = 허용된 useEffect).
 */
export function IosNativeGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const check = () => {
      if (isIosNative()) {
        setBlocked(true);
        router.replace('/inner/cashbook');
      }
    };
    check();
    window.addEventListener('uandi:native-ready', check);
    return () => window.removeEventListener('uandi:native-ready', check);
  }, [router]);

  if (blocked) return <MascotLoader fullScreen />;
  return <>{children}</>;
}
