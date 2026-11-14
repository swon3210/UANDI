import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_HOST, isAdminHost } from '@/lib/admin/admin-host';
import { DISABLED_ROUTE_FALLBACK, isDisabledRoute } from '@/lib/disabled-features';

// AuthInit.tsx에서 로그인/로그아웃 시 설정하는 쿠키
// 값: 'with_couple' | 'no_couple' | (없음 = 미인증 또는 첫 방문)
const AUTH_COOKIE = 'uandi-auth';

// /admin 은 로그인만 요구한다(커플 불필요). 권한은 API가 ADMIN_EMAILS 로 검사한다.
const PROTECTED_ROUTES = ['/inner', '/outer', '/community', '/settings', '/admin'];
const COUPLE_REQUIRED_ROUTES = ['/inner', '/outer', '/community', '/settings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get(AUTH_COOKIE)?.value;

  // 어드민 전용 도메인: / 를 어드민 화면으로 보여주고 다른 앱 화면은 열지 않는다.
  // 로그인은 어드민 화면이 직접 받으므로 쿠키 검사를 하지 않는다. 정적 파일·/__/auth 프록시는 통과.
  if (ADMIN_HOST) {
    if (isAdminHost(request.headers.get('host'))) {
      if (pathname.startsWith('/__/') || /\.[a-z0-9]+$/i.test(pathname)) {
        return NextResponse.next();
      }
      if (pathname === '/') return NextResponse.rewrite(new URL('/admin', request.url));
      return NextResponse.redirect(new URL('/', request.url));
    }
    // 서비스 도메인에는 어드민이 없는 것처럼 404(존재하지 않는 경로로 rewrite → not-found)
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return NextResponse.rewrite(new URL('/_not-found-admin', request.url));
    }
  }

  // 관리하지 않는 기능(재테크·커뮤니티)은 가계부로 보낸다.
  // 미인증이면 가계부(보호 경로)에서 다시 홈으로 리다이렉트된다.
  if (isDisabledRoute(pathname)) {
    return NextResponse.redirect(new URL(DISABLED_ROUTE_FALLBACK, request.url));
  }

  // 쿠키 없음 = 미인증 또는 첫 방문
  // 보호된 경로(/inner, /outer, /settings, /onboarding)는 홈으로 리다이렉트
  if (!authCookie) {
    if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname === '/onboarding') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 커플 미연결 상태
  if (authCookie === 'no_couple') {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    if (COUPLE_REQUIRED_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.next();
  }

  // 커플 연결 완료 상태
  if (authCookie === 'with_couple') {
    if (pathname === '/onboarding') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|\\.well-known).*)'],
};
