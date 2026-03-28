---
title: 'Expo 인앱 WebView에서 Google 로그인 구현하기'
date: '2026-03-28'
summary: '인앱 WebView에서 팝업 방식 Google 로그인이 안 되는 문제를 expo-auth-session과 네이티브 브릿지로 해결한 과정.'
tags: ['auth', 'infrastructure']
draft: true
---

## 배경

UANDI 앱은 Expo 기반의 모바일 앱에서 WebView로 Next.js 웹앱을 띄우는 구조다. 문제는 Google 로그인. 웹에서는 `signInWithPopup`으로 잘 동작하지만, 인앱 WebView에서는 팝업이 차단되거나 리다이렉트 후 돌아오지 못한다. 모바일 앱에서 Google 로그인을 어떻게든 동작하게 만들어야 했다.

## 구현 내용

핵심 아이디어는 **WebView ↔ Expo 네이티브 브릿지**다. 인앱 WebView임을 감지하면, 웹에서 직접 Google OAuth를 시도하는 대신 네이티브 앱에 위임한다.

웹 쪽(`auth.ts`)에서는 인앱 WebView인지 감지한 후, `ReactNativeWebView.postMessage`로 네이티브에 Google 로그인을 요청한다. 네이티브가 OAuth를 완료하면 `window.__handleNativeGoogleLogin`을 통해 ID 토큰을 돌려주고, 웹에서 `signInWithCredential`로 Firebase 인증을 완료한다.

```typescript
// 웹: 인앱 WebView → 네이티브에 OAuth 위임
if (isInAppWebView() && w?.ReactNativeWebView) {
  return new Promise<void>((resolve, reject) => {
    _resolveNativeLogin = resolve;
    _rejectNativeLogin = reject;
    (w.ReactNativeWebView as { postMessage: (msg: string) => void })
      .postMessage(JSON.stringify({ type: 'GOOGLE_LOGIN' }));
  });
}
```

Expo 쪽(`app-webview.tsx`)에서는 `expo-auth-session`의 `useIdTokenAuthRequest`로 Google OAuth를 처리하고, 결과를 `injectJavaScript`로 WebView에 전달한다.

```typescript
// Expo: OAuth 결과를 WebView에 주입
useEffect(() => {
  if (response?.type === 'success') {
    const idToken = response.params.id_token;
    webViewRef.current?.injectJavaScript(
      `window.__handleNativeGoogleLogin(${JSON.stringify(idToken)}); true;`
    );
  }
}, [response]);
```

추가로, 네이티브 OAuth에는 플랫폼별 Client ID가 필요해서 Google Cloud Console에서 iOS/Android용 OAuth Client ID를 별도 발급받았다. 이 값들은 `apps/mobile/.env`에 관리하고, worktree에서도 접근할 수 있도록 `setup-env.sh`에 심볼릭 링크를 추가했다.

## 배운 것

- **인앱 WebView에서는 OAuth 팝업/리다이렉트가 안 된다.** 브라우저와 달리 WebView는 별도 창을 열 수 없고, 리다이렉트 후 원래 페이지로 돌아오는 메커니즘이 없다.
- **네이티브 브릿지 패턴**이 생각보다 깔끔하다. `postMessage`와 `injectJavaScript` 조합으로 웹 ↔ 네이티브 양방향 통신이 가능하다.
- **expo-auth-session은 Expo Go에서 동작하지 않는다.** 네이티브 모듈이라 EAS Build로 개발용 빌드를 만들어야 테스트할 수 있다.
- **Google OAuth Client ID는 플랫폼별로 다르다.** 웹/iOS/Android 각각 별도로 발급해야 하고, Android는 SHA-1 fingerprint도 필요하다. EAS에 여러 키스토어가 있으면 default를 사용해야 빌드와 일치한다.
