/**
 * 당장 관리하지 않아 접근을 막아 둔 기능의 라우트 목록.
 *
 * 가계부(/inner/cashbook)와 갤러리(/inner/photos)만 열어 두고,
 * 재테크(/outer)·커뮤니티(/community)는 막는다.
 * - middleware.ts: 해당 경로로 들어오면 가계부로 리다이렉트
 * - AppSidebarTrigger: 사이드바에서 해당 섹션을 숨김
 *
 * 기능을 다시 열려면 이 배열에서 경로를 빼면 된다(해당 E2E의 test.skip도 함께 해제).
 */
export const DISABLED_ROUTE_PREFIXES = ['/outer', '/community'] as const;

/** 막힌 기능으로 들어왔을 때 보낼 곳 */
export const DISABLED_ROUTE_FALLBACK = '/inner/cashbook';

export function isDisabledRoute(pathname: string): boolean {
  return DISABLED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
