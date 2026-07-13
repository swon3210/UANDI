// 자체 footer CTA를 가진 풀스크린 편집/위저드 플로우(목표 위저드·일괄수정·항목 편집,
// 카테고리/설정 편집 등)를 나타내는 라우트. 이 화면에서는 전역 플로팅 추가 버튼(FAB)이
// 자체 하단 CTA와 겹치므로 숨긴다.
// (standalone)에 편집 플로우 페이지를 추가/삭제하면 이 목록도 함께 갱신할 것.
const CHROMELESS_PREFIXES = [
  '/inner/cashbook/categories',
  '/inner/cashbook/settings',
  '/inner/cashbook/plan/annual/wizard',
  '/inner/cashbook/plan/annual/bulk-edit',
  '/inner/cashbook/plan/annual/items',
  '/inner/cashbook/history/weekly/notifications',
];

/** 해당 경로가 자체 하단 CTA를 가진 풀스크린 편집 플로우인지 여부(전역 FAB를 숨긴다). */
export function isChromelessRoute(pathname: string): boolean {
  return CHROMELESS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
