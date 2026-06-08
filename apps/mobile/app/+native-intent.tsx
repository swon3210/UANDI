// 이 앱은 단일 WebView 래퍼라 네이티브 라우트가 없다.
// 외부에서 들어온 모든 딥링크(uandi://..., https://uandi-web.vercel.app/...)는
// 홈(WebView) 화면으로 보내고, 실제 목적지 이동은 useDeepLink가
// 원본 URL을 잡아 WebView에 주입하는 방식으로 처리한다.
//
// 이 리다이렉트가 없으면 expo-router가 `/inner/cashbook/history` 같은 경로를
// 네이티브 라우트로 매칭하려다 "Unmatched Route" 화면을 띄운다.
export function redirectSystemPath(_event: { path: string; initial: boolean }): string {
  return '/';
}
