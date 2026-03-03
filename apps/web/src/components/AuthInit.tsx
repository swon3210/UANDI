'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
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
  const setUser = useSetAtom(userAtom);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setAuthCookie(null);
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

      setAuthCookie(userDoc.coupleId !== null ? 'with_couple' : 'no_couple');
      setUser(userDoc);
    });

    return () => unsubscribe();
  }, [setUser]);

  return null;
}
