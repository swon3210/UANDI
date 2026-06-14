// 전역 하단탭(AppNav)을 숨기는 풀스크린 라우트.
//
// 자체 footer CTA를 가진 풀스크린 편집/위저드 플로우(목표 위저드·일괄수정·항목 편집,
// 카테고리/설정 편집 등)는 전역 하단탭이 겹치면 동선이 어색하므로 chromeless로 둔다.
// 반대로 "둘러보는" 화면(현금흐름, 목표 랜딩)은 전역 하단탭을 그대로 노출한다.
// (standalone)에 편집 플로우 페이지를 추가/삭제하면 이 목록도 함께 갱신할 것.
const CHROMELESS_PREFIXES = [
  '/inner/cashbook/categories',
  '/inner/cashbook/settings',
  '/inner/cashbook/plan/annual/wizard',
  '/inner/cashbook/plan/annual/bulk-edit',
  '/inner/cashbook/plan/annual/items',
  '/inner/cashbook/history/weekly/notifications',
];

/** 해당 경로에서 전역 하단탭을 숨겨야 하는지 여부. */
export function isChromelessRoute(pathname: string): boolean {
  return CHROMELESS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
