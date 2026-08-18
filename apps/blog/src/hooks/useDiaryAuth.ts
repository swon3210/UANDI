'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type AuthError,
} from 'firebase/auth';
import { getAuth, isFirebaseConfigured } from '@/lib/firebase';
import { DIARY_OWNER_EMAIL } from '@/lib/diary';

export type DiaryAuth =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  /** 로그아웃 상태 — 링크로 들어온 방문자 */
  | { status: 'guest' }
  /** 로그인은 했지만 주인 계정이 아님 */
  | { status: 'stranger'; email: string | null }
  | { status: 'owner'; uid: string; email: string };

/**
 * 일기 편집 권한 판별. 여기서 막는 것은 화면 표시일 뿐이고,
 * 실제 권한은 Firestore 보안 규칙(diaryEntries)이 강제한다.
 */
export function useDiaryAuth() {
  const [auth, setAuth] = useState<DiaryAuth>(
    isFirebaseConfigured ? { status: 'loading' } : { status: 'unconfigured' }
  );

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    return onAuthStateChanged(getAuth(), (user) => {
      if (!user) {
        setAuth({ status: 'guest' });
        return;
      }
      if (user.email === DIARY_OWNER_EMAIL) {
        setAuth({ status: 'owner', uid: user.uid, email: user.email });
        return;
      }
      setAuth({ status: 'stranger', email: user.email });
    });
  }, []);

  const signIn = useCallback(async () => {
    try {
      await signInWithPopup(getAuth(), new GoogleAuthProvider());
    } catch (error) {
      // 모바일 브라우저나 팝업 차단 환경에서는 리디렉션으로 돌아간다.
      const code = (error as AuthError)?.code;
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(getAuth(), new GoogleAuthProvider());
        return;
      }
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        throw error;
      }
    }
  }, []);

  const signOutOwner = useCallback(async () => {
    await signOut(getAuth());
  }, []);

  return { auth, signIn, signOut: signOutOwner };
}
