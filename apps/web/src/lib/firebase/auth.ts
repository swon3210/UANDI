import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser, Unsubscribe } from 'firebase/auth';
import { getAuth } from './config';

const provider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<void> {
  // E2E 테스트에서 에러 시나리오 모킹용 (config.ts에서 window.__signInWithGoogle 설정)
  if (typeof window !== 'undefined' && (window as any).__signInWithGoogleMock) {
    await (window as any).__signInWithGoogleMock();
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
