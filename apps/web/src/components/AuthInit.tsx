'use client';

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from '@/lib/firebase/auth';
import { userAtom } from '@/stores/auth.store';
import { getUserDocument, createUserDocument } from '@/services/user';
import type { User } from '@/types';

function setAuthCookie(status: 'with_couple' | 'no_couple' | null) {
  if (status === null) {
    document.cookie = 'uandi-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  } else {
    document.cookie = `uandi-auth=${status}; path=/; SameSite=Lax`;
  }
}

// Firebase onAuthStateChanged를 구독하고 userAtom을 업데이트하는 초기화 컴포넌트.
// layout.tsx > Providers > AuthInit 순서로 마운트됩니다.
export function AuthInit() {
  const user = useAtomValue(userAtom);
  const setUser = useSetAtom(userAtom);

  // userAtom이 변경될 때마다 uandi-auth 쿠키를 동기화.
  // onboarding 완료 시 setUser()가 직접 호출되어도 쿠키가 갱신된다.
  useEffect(() => {
    if (user === undefined) return; // 로딩 중 — 쿠키 조작 보류
    if (user === null) {
      setAuthCookie(null);
    } else {
      setAuthCookie(user.coupleId !== null ? 'with_couple' : 'no_couple');
    }
  }, [user]);

  // Firebase Auth 상태 변경 구독 — 로그인/로그아웃 시 userAtom 갱신
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      let userDoc = await getUserDocument(firebaseUser.uid);
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

      setUser(userDoc);
    });

    return () => unsubscribe();
  }, [setUser]);

  return null;
}
