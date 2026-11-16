'use client';

import { useEffect } from 'react';
import { appClientCookieString } from '@/lib/app-gate';
import { isNativeApp } from '@/lib/native';

/**
 * 네이티브 앱(WebView) 안이면 앱 표식 쿠키를 갱신한다. middleware 의 앱 전용 게이트가 이 쿠키로
 * 앱 요청을 알아본다(docs/pages/08-get-app.md). 페이지를 열 때마다 다시 써서 만료(iOS 의 스크립트
 * 쿠키 7일 제한 포함)로 안내 페이지를 거치는 일을 줄인다.
 */
export function AppClientCookieSync(): null {
  useEffect(() => {
    if (!isNativeApp()) return;
    document.cookie = appClientCookieString(window.location.protocol === 'https:');
  }, []);

  return null;
}
