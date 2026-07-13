'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, getRedirectSignInResult } from '@/lib/firebase/auth';
import { setAuthCookie } from '@/lib/auth-cookie';
import { userAtom } from '@/stores/auth.store';
import { getUserDocument, createUserDocument } from '@/services/user';
import type { User } from '@/types';

// Firebase onAuthStateChanged를 구독하고 userAtom을 업데이트하는 초기화 컴포넌트.
// layout.tsx > Providers > AuthInit 순서로 마운트됩니다.
export function AuthInit() {
  const setUser = useSetAtom(userAtom);

  useEffect(() => {
    // 인앱 WebView(signInWithRedirect) 복귀 시 리다이렉트 로그인 결과를 완료 처리한다.
    // 실패를 조용히 삼키지 않도록 에러를 로깅한다(예: iOS 애플 로그인 실패 원인 추적).
    getRedirectSignInResult().catch((e) => {
      console.error('[AuthInit] getRedirectResult ERROR:', e);
    });

    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setAuthCookie(null);
        setUser(null);
        return;
      }

      let userDoc: User | null = null;
      try {
        userDoc = await getUserDocument(firebaseUser.uid);
      } catch (e) {
        console.log('[AuthInit] getUserDocument ERROR:', e);
      }
      if (!userDoc) {
        const newUserData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? '',
          displayName: firebaseUser.displayName ?? '',
          photoURL: firebaseUser.photoURL ?? null,
          coupleId: null,
          createdAt: Timestamp.now(),
        };
        await createUserDocument(firebaseUser.uid, {
          email: newUserData.email,
          displayName: newUserData.displayName,
          photoURL: newUserData.photoURL,
          coupleId: newUserData.coupleId,
        });
        userDoc = newUserData;
      }

      setAuthCookie(userDoc.coupleId !== null ? 'with_couple' : 'no_couple');
      setUser(userDoc);
    });

    return () => unsubscribe();
  }, [setUser]);

  return null;
}
