/**
 * 이 문서(탭) 안에서의 앱 내 이동 기록. BackButton이 router.back()을 써도 앱 안에 머무는지 판단한다.
 * 모듈 상태라 새로고침·딥링크 직접 진입 시 비어 있는 상태로 시작한다.
 */
let currentPath: string | null = null;
let previousPath: string | null = null;
let rootNext = false;

/** 경로가 바뀔 때마다 호출한다(NavigationTracker). */
export function recordPath(path: string) {
  if (path === currentPath) return;
  previousPath = rootNext ? null : currentPath;
  rootNext = false;
  currentPath = path;
}

/** 직전 기록이 앱 안의 페이지면 true — router.back()으로 돌아가도 앱을 벗어나지 않는다. */
export function hasInAppPrevious() {
  return previousPath !== null;
}

/**
 * 부모 경로로 replace 하기 직전에 호출한다. replace는 기록을 쌓지 않으므로,
 * 다음 페이지는 "이전 기록 없음"으로 취급해야 그다음 뒤로가기도 앱 밖으로 나가지 않는다.
 */
export function markNextAsRoot() {
  rootNext = true;
}
