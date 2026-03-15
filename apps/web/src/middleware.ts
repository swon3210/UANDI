import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// AuthInit.tsx에서 로그인/로그아웃 시 설정하는 쿠키
// 값: 'with_couple' | 'no_couple' | (없음 = 미인증 또는 첫 방문)
const AUTH_COOKIE = 'uandi-auth';

const PROTECTED_ROUTES = ['/photos', '/cashbook', '/settings'];
const COUPLE_REQUIRED_ROUTES = ['/photos', '/cashbook', '/settings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get(AUTH_COOKIE)?.value;

  // 쿠키 없음 = 미인증 또는 첫 방문
  // 보호된 경로(/photos, /cashbook, /onboarding)는 홈으로 리다이렉트
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
