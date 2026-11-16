import type { Metadata } from 'next';
import { AppInstallLanding } from '@/components/landing/AppInstallLanding';
import { BrowserSessionCleanup } from '@/components/landing/BrowserSessionCleanup';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/constants/store-links';
import { APP_CLIENT_COOKIE, sanitizeNextPath } from '@/lib/app-gate';

export const metadata: Metadata = {
  title: '앱 설치 안내 | 말랑 가계부',
  description: '말랑 가계부는 앱에서 사용할 수 있어요. Google Play와 App Store에서 설치하세요.',
};

// 앱(WebView)인데 표식 쿠키가 아직 없어 여기로 온 경우(첫 실행, 쿠키 만료) — 쿠키를 심고 원래
// 가려던 곳으로 돌려보낸다. 하이드레이션 전에 실행돼 안내 화면이 비치지 않는다.
// 쿠키가 막혀 있으면 무한 왕복하므로 10초 안의 재시도는 하지 않는다.
// next 는 서버에서 끼워 넣지 않고 스크립트가 location 에서 직접 읽는다(주입 여지 없음).
const RETURN_TO_APP_SCRIPT = `(function(){
  try {
    if (!(window.__UANDI_NATIVE__ || window.ReactNativeWebView)) return;
    var last = Number(sessionStorage.getItem('uandi:app-return') || 0);
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem('uandi:app-return', String(Date.now()));
    document.cookie = '${APP_CLIENT_COOKIE}=1; path=/; max-age=31536000; SameSite=Lax' +
      (location.protocol === 'https:' ? '; Secure' : '');
    var next = new URLSearchParams(location.search).get('next') || '/';
    if (next.charAt(0) !== '/' || next.charAt(1) === '/' || next.indexOf('\\\\') !== -1 ||
        next.indexOf('/get-app') === 0) next = '/';
    location.replace(next);
  } catch (e) {}
})();`;

type GetAppPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function GetAppPage({ searchParams }: GetAppPageProps) {
  const { next } = await searchParams;
  const nextPath = sanitizeNextPath(typeof next === 'string' ? next : null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <script dangerouslySetInnerHTML={{ __html: RETURN_TO_APP_SCRIPT }} />
      <BrowserSessionCleanup />
      <AppInstallLanding
        playStoreUrl={PLAY_STORE_URL}
        appStoreUrl={APP_STORE_URL}
        fromInvite={nextPath.startsWith('/invite/')}
      />
    </main>
  );
}
