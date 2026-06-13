'use client';

import { useEffect } from 'react';

// native Android 앱은 webview를 시스템 내비게이션 바 위(edge-to-edge)에 그리면서
// env(safe-area-inset-bottom)에 시스템 바 높이를 보고하지만, OS가 시스템 바를
// 별도 영역으로 이미 처리하기 때문에 하단 패딩이 중복으로 들어간다.
// native(android)에서는 --safe-bottom 을 0으로 덮어써 중복 패딩을 제거한다.
// iOS(홈 인디케이터)·웹 브라우저는 env() 기본값을 그대로 사용한다.
export function NativeSafeAreaFix(): null {
  useEffect(() => {
    const apply = () => {
      if (window.__UANDI_NATIVE__?.platform === 'android') {
        document.documentElement.style.setProperty('--safe-bottom', '0px');
      }
    };
    apply();
    window.addEventListener('uandi:native-ready', apply);
    return () => window.removeEventListener('uandi:native-ready', apply);
  }, []);

  return null;
}
