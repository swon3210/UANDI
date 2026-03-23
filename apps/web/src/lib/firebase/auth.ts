import {
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  deleteUser,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser, Unsubscribe } from 'firebase/auth';
import { getAuth } from './config';

const provider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<void> {
  // E2E 테스트에서 에러 시나리오 모킹용 (config.ts에서 window.__signInWithGoogle 설정)
  const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null;
  if (w?.__signInWithGoogleMock) {
    await (w.__signInWithGoogleMock as () => Promise<void>)();
    return;
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
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'auth/requires-recent-login'
    ) {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      await deleteUser(user);
    } else {
      throw error;
    }
  }
}
