import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  reauthenticateWithPopup,
  deleteUser,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import type { AuthProvider, User as FirebaseUser, Unsubscribe } from 'firebase/auth';
import { getAuth } from './config';
import { removeCurrentDeviceTokens } from '@/services/fcm-token';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Apple 로그인 — App Store 심사 가이드라인 4.8 대응(제3자 소셜 로그인 제공 시 필수).
// Firebase Console에서 Apple provider 활성화 + Apple Developer의 Service ID/Key 설정이 선행돼야 한다.
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

function isInAppWebView(): boolean {
  if (typeof window === 'undefined') return false;
  // 네이티브 RN WebView 래퍼가 주입하는 신호로 감지한다.
  // iOS 는 구글 disallowed_useragent 차단을 피하려고 UA 에서 'wv' 를 뺀 깨끗한 Safari UA 를 쓰므로,
  // UA 문자열만으로는 WebView 를 감지할 수 없다. 브리지 존재로 판단해야 iOS 도 계속 redirect 경로를 탄다
  // (WKWebView 는 signInWithPopup 이 동작하지 않음).
  if (window.__UANDI_NATIVE__ != null || window.ReactNativeWebView != null) return true;
  const ua = navigator.userAgent;
  return /wv|WebView/i.test(ua) || (/Android/.test(ua) && /Version\/[\d.]+/.test(ua));
}

// 공통 로그인 헬퍼: 인앱 WebView는 signInWithRedirect(팝업이 외부 브라우저로 열리는 문제 방지),
// 그 외에는 signInWithPopup을 사용한다.
async function signInWithProvider(provider: AuthProvider): Promise<void> {
  if (isInAppWebView()) {
    await signInWithRedirect(getAuth(), provider);
    return;
  }
  await signInWithPopup(getAuth(), provider);
}

export async function signInWithGoogle(): Promise<void> {
  // E2E 테스트에서 에러 시나리오 모킹용 (config.ts에서 window.__signInWithGoogle 설정)
  const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null;
  if (w?.__signInWithGoogleMock) {
    await (w.__signInWithGoogleMock as () => Promise<void>)();
    return;
  }

  await signInWithProvider(googleProvider);
}

export async function signInWithApple(): Promise<void> {
  // E2E 테스트에서 에러 시나리오 모킹용
  const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null;
  if (w?.__signInWithAppleMock) {
    await (w.__signInWithAppleMock as () => Promise<void>)();
    return;
  }

  await signInWithProvider(appleProvider);
}

export async function signOut(): Promise<void> {
  // 로그아웃 전에 현재 기기의 FCM 토큰을 제거해, 로그아웃 후에도 푸시가 오는 것을 막는다.
  // best-effort — 실패해도 로그아웃은 진행한다.
  const uid = getAuth().currentUser?.uid ?? null;
  if (uid) {
    await removeCurrentDeviceTokens(uid).catch(() => {});
  }
  await firebaseSignOut(getAuth());
}

export function onAuthStateChanged(callback: (user: FirebaseUser | null) => void): Unsubscribe {
  return firebaseOnAuthStateChanged(getAuth(), callback);
}

// 인앱 WebView 는 signInWithRedirect 를 사용하므로, 리다이렉트 복귀 시 결과를 완료 처리해야 한다.
// 이 호출이 없으면 실패(예: iOS 저장소 차단으로 인한 애플 로그인 실패)가 조용히 삼켜진다.
// 성공 시에는 onAuthStateChanged 가 발화하므로 반환값은 사용하지 않아도 되지만, 에러 표면화를 위해 호출한다.
export async function getRedirectSignInResult() {
  return getRedirectResult(getAuth());
}

export async function deleteCurrentUser(): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('NOT_AUTHENTICATED');

  try {
    await deleteUser(user);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'auth/requires-recent-login'
    ) {
      // 로그인에 사용한 provider로 재인증한다 (Apple/Google 혼용 대응).
      const providerId = user.providerData[0]?.providerId;
      const reauthProvider =
        providerId === 'apple.com' ? new OAuthProvider('apple.com') : new GoogleAuthProvider();
      await reauthenticateWithPopup(user, reauthProvider);
      await deleteUser(user);
    } else {
      throw error;
    }
  }
}
