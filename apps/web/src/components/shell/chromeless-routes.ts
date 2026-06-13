// 전역 하단탭(AppNav)을 숨기는 풀스크린 라우트.
//
// 이 목록은 `app/inner/cashbook/(standalone)` 라우트 그룹과 1:1로 대응한다.
// (standalone) 그룹은 자체 하단 CTA(위저드 footer 등)를 가지는 풀스크린 플로우이므로
// 전역 하단탭이 함께 뜨면 CTA가 가려진다. (standalone)에 페이지를 추가/삭제하면
// 이 목록도 함께 갱신할 것.
const CHROMELESS_PREFIXES = [
  '/inner/cashbook/cashflow',
  '/inner/cashbook/categories',
  '/inner/cashbook/settings',
  '/inner/cashbook/plan',
  '/inner/cashbook/history/weekly/notifications',
];

/** 해당 경로에서 전역 하단탭을 숨겨야 하는지 여부. */
export function isChromelessRoute(pathname: string): boolean {
  return CHROMELESS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
