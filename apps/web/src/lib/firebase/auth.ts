import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  reauthenticateWithPopup,
  deleteUser,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser, Unsubscribe } from 'firebase/auth';
import { getAuth } from './config';

const provider = new GoogleAuthProvider();

function isInAppWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /wv|WebView/i.test(ua) || (/Android/.test(ua) && /Version\/[\d.]+/.test(ua));
}

// --- Native auth bridge (WebView ↔ Expo) ---
let _resolveNativeLogin: (() => void) | null = null;
let _rejectNativeLogin: ((err: Error) => void) | null = null;

if (typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>;

  w.__handleNativeGoogleLogin = async (idToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(getAuth(), credential);
      _resolveNativeLogin?.();
    } catch (err) {
      _rejectNativeLogin?.(err as Error);
    } finally {
      _resolveNativeLogin = null;
      _rejectNativeLogin = null;
    }
  };

  w.__handleNativeGoogleLoginError = (errorMessage: string) => {
    _rejectNativeLogin?.(new Error(errorMessage));
    _resolveNativeLogin = null;
    _rejectNativeLogin = null;
  };

  w.__handleNativeGoogleLoginDismiss = () => {
    _resolveNativeLogin?.();
    _resolveNativeLogin = null;
    _rejectNativeLogin = null;
  };
}

export async function signInWithGoogle(): Promise<void> {
  // E2E 테스트에서 에러 시나리오 모킹용 (config.ts에서 window.__signInWithGoogle 설정)
  const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null;
  if (w?.__signInWithGoogleMock) {
    await (w.__signInWithGoogleMock as () => Promise<void>)();
    return;
  }

  // 인앱 WebView → 네이티브 앱에 Google OAuth 위임
  if (isInAppWebView() && w?.ReactNativeWebView) {
    return new Promise<void>((resolve, reject) => {
      _resolveNativeLogin = resolve;
      _rejectNativeLogin = reject;
      (w.ReactNativeWebView as { postMessage: (msg: string) => void }).postMessage(
        JSON.stringify({ type: 'GOOGLE_LOGIN' }),
      );
    });
  }

  await signInWithPopup(getAuth(), provider);
}

export async function signOut(): Promise<void> {
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
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'auth/requires-recent-login') {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      await deleteUser(user);
    } else {
      throw error;
    }
  }
}
