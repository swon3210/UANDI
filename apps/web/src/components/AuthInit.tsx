'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, getRedirectSignInResult } from '@/lib/firebase/auth';
import { setAuthCookie } from '@/lib/auth-cookie';
import { getLocaleCookie, setLocaleCookie } from '@/lib/locale';
import { signUpMethod, trackEvent } from '@/lib/analytics';
import { userAtom } from '@/stores/auth.store';
import { getUserDocument, createUserDocument } from '@/services/user';
import type { User } from '@/types';

// Firebase onAuthStateChanged를 구독하고 userAtom을 업데이트하는 초기화 컴포넌트.
// layout.tsx > Providers > AuthInit 순서로 마운트됩니다.
export function AuthInit() {
  const setUser = useSetAtom(userAtom);
  const router = useRouter();

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
        trackEvent('sign_up', { method: signUpMethod(firebaseUser.providerData[0]?.providerId) });
        userDoc = newUserData;
      }

      setAuthCookie(userDoc.coupleId !== null ? 'with_couple' : 'no_couple');
      setUser(userDoc);

      // 설정에서 고른 언어(users.locale)가 이 기기의 쿠키와 다르면(새 기기·쿠키 삭제) 쿠키를 맞추고
      // 서버 컴포넌트를 다시 렌더해 메시지·<html lang> 을 갱신한다. 쿠키 값이 우선이 아니라 문서 값이 우선.
      if (userDoc.locale && userDoc.locale !== getLocaleCookie()) {
        setLocaleCookie(userDoc.locale);
        router.refresh();
      }
    });

    return () => unsubscribe();
  }, [setUser, router]);

  return null;
}
