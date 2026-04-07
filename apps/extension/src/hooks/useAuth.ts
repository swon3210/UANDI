import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { userAtom, authStatusAtom, authReadyAtom } from '@/stores/auth.store';
import type { ExtensionUser } from '@/stores/auth.store';

export function useAuth() {
  const user = useAtomValue(userAtom);
  const authStatus = useAtomValue(authStatusAtom);
  return { user, authStatus };
}

export function useAuthInit() {
  const setUser = useSetAtom(userAtom);
  const setAuthReady = useSetAtom(authReadyAtom);

  useEffect(() => {
    // chrome.storage 캐시로 빠른 프리뷰 (authReady 전이므로 status는 여전히 loading)
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['user'], (result) => {
        if (result.user) {
          setUser(result.user as ExtensionUser);
        }
      });
    }

    // Firebase가 최종 인증 상태를 결정 → authReady를 true로 전환
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setAuthReady(true);
        return;
      }

      // Firestore에서 사용자 문서 조회하여 coupleId 획득
      const userDoc = await getDoc(doc(db, `users/${firebaseUser.uid}`));
      const userData = userDoc.data();

      const extUser: ExtensionUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        displayName: firebaseUser.displayName ?? '',
        photoURL: firebaseUser.photoURL,
        coupleId: userData?.coupleId ?? null,
      };

      setUser(extUser);
      setAuthReady(true);

      // chrome.storage에 캐싱
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ user: extUser });
      }
    });

    return unsubscribe;
  }, [setUser, setAuthReady]);
}

export async function signInWithChrome(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.identity) {
      reject(new Error('Chrome Identity API를 사용할 수 없습니다'));
      return;
    }

    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError?.message ?? '인증 토큰 획득 실패'));
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(null, token);
        await signInWithCredential(auth, credential);
        resolve();
      } catch (error) {
        // 토큰이 만료됐을 수 있음 — 캐시 제거 후 재시도
        chrome.identity.removeCachedAuthToken({ token }, () => {
          reject(error);
        });
      }
    });
  });
}

export async function signOut(): Promise<void> {
  await auth.signOut();
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.remove(['user']);
  }
}
