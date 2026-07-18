/**
 * 모바일 네이티브(WebView) 래퍼가 주입하는 브리지(window.__UANDI_NATIVE__)를 읽는 유틸.
 *
 * platform 은 네이티브가 페이지 로드 전에 주입한다(app-webview.tsx).
 * - android: FCM 토큰과 함께 주입
 * - ios: 토큰이 없어도 platform 만 명시 주입 (App Store 심사 대응)
 *
 * (Window.__UANDI_NATIVE__ 의 타입 선언은 NativeFcmBridge.tsx 의 `declare global` 에 있다.)
 */

/**
 * 현재 웹이 "iOS 네이티브 앱(WebView) 안"에서 렌더링되는지 여부.
 *
 * App Store 심사(Guideline 5.6) 대응으로, iOS 앱 안에서는 가계부 외 기능
 * (갤러리/재테크/커뮤니티)을 숨기기 위해 사용한다. Android/웹 브라우저에는 영향 없음.
 */
export function isIosNative(): boolean {
  if (typeof window === 'undefined') return false;
  return window.__UANDI_NATIVE__?.platform === 'ios';
}
