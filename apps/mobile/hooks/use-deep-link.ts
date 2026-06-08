import { useEffect } from 'react';
import * as Linking from 'expo-linking';

const UANDI_HOST = 'uandi-web.vercel.app';
const SCHEME_PREFIX = 'uandi://';

// 외부에서 들어온 딥링크 URL을 웹앱 경로로 변환한다.
//   uandi://inner/cashbook                      → /inner/cashbook
//   uandi://community/123?tab=hot               → /community/123?tab=hot
//   https://uandi-web.vercel.app/community/123   → /community/123
// 우리 앱과 무관한 URL이면 null을 반환한다.
export function toWebPath(url: string): string | null {
  if (url.startsWith(SCHEME_PREFIX)) {
    const rest = url.slice(SCHEME_PREFIX.length).replace(/^\/+/, '');
    return rest ? `/${rest}` : '/';
  }
  const httpsPrefix = `https://${UANDI_HOST}`;
  if (url === httpsPrefix || url.startsWith(`${httpsPrefix}/`)) {
    const rest = url.slice(httpsPrefix.length);
    return rest || '/';
  }
  return null;
}

// 커스텀 스킴/유니버설 링크로 앱이 열렸을 때 목적지 경로를 전달한다.
// 콜드 스타트(getInitialURL)와 포그라운드 진입(url 이벤트)을 모두 처리.
export function useDeepLink(onDeeplink: (path: string) => void) {
  useEffect(() => {
    let mounted = true;

    void Linking.getInitialURL().then((url) => {
      if (!mounted || !url) return;
      const path = toWebPath(url);
      if (path) onDeeplink(path);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      const path = toWebPath(url);
      if (path) onDeeplink(path);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [onDeeplink]);
}
