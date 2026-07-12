import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
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
  if (typeof navigator === 'undefined') return false;
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
