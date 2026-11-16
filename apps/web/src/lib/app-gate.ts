/**
 * 앱 전용 게이트 — 일반 브라우저로 들어온 요청을 앱 설치 안내(/get-app)로 보낸다.
 * 명세: docs/pages/08-get-app.md
 *
 * 서버(middleware)는 window 브리지를 볼 수 없으므로 아래 두 신호로 앱(WebView)을 알아본다.
 *  1) UA 표식(APP_UA_MARKER) — 네이티브가 UA에 직접 붙이는 경우(E2E도 이 표식을 쓴다)
 *  2) 쿠키(APP_CLIENT_COOKIE) — 웹이 네이티브 브리지를 확인한 뒤 심는다(AppClientCookieSync, /get-app)
 *
 * 둘 다 위조할 수 있다. 이 게이트는 "실수로/습관적으로 브라우저에서 로그인해 토큰을 남기는 것"을
 * 막는 장치이지 접근 제어가 아니다. 데이터 보호는 Firestore 규칙·API 토큰 검증이 맡는다.
 */
export const APP_UA_MARKER = 'UANDI-App';
export const APP_CLIENT_COOKIE = 'uandi-app';
export const GET_APP_PATH = '/get-app';

/** 플로팅 버블(/overlay/*)은 브리지 없는 순수 Android WebView라 UA의 `wv` 토큰으로만 알아본다. */
const OVERLAY_PREFIX = '/overlay/';
const ANDROID_WEBVIEW_UA = /Android.*; wv\)/;

/**
 * 브라우저에서도 열려야 하는 경로.
 * - /get-app: 안내 페이지 자신
 * - /privacy, /support, /account-deletion: 스토어 등록정보가 가리키는 공개 URL
 * - /admin: 운영자가 브라우저로 쓰는 화면(전용 도메인이 없을 때의 경로)
 * - /__/: Firebase Auth 핸들러 프록시(next.config.ts rewrites)
 */
const PUBLIC_PATHS = [GET_APP_PATH, '/privacy', '/support', '/account-deletion', '/admin'];
const STATIC_FILE = /\.[a-z0-9]+$/i;

/**
 * 프로덕션 빌드에서는 기본으로 켜지고, 로컬 개발(next dev)에서는 꺼진다.
 * APP_ONLY_GATE=on|off 로 덮어쓴다(예: Vercel 프리뷰에서 브라우저로 확인하려면 off).
 */
export function isAppGateEnabled(): boolean {
  const flag = process.env.APP_ONLY_GATE;
  if (flag === 'on') return true;
  if (flag === 'off') return false;
  return process.env.NODE_ENV === 'production';
}

export function isGateExemptPath(pathname: string): boolean {
  if (pathname.startsWith('/__/') || STATIC_FILE.test(pathname)) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isAppRequest(input: {
  pathname: string;
  userAgent: string | null;
  appCookie: string | undefined;
}): boolean {
  const ua = input.userAgent ?? '';
  if (ua.includes(APP_UA_MARKER)) return true;
  if (input.appCookie === '1') return true;
  return input.pathname.startsWith(OVERLAY_PREFIX) && ANDROID_WEBVIEW_UA.test(ua);
}

/** 앱에서 되돌아갈 경로. 같은 출처의 절대 경로만 허용한다(오픈 리다이렉트 방지). */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/';
  if (next === GET_APP_PATH || next.startsWith(`${GET_APP_PATH}?`)) return '/';
  return next;
}

/** document.cookie 에 넣을 앱 표식 쿠키 문자열(1년). */
export function appClientCookieString(secure: boolean): string {
  return `${APP_CLIENT_COOKIE}=1; path=/; max-age=31536000; SameSite=Lax${secure ? '; Secure' : ''}`;
}
