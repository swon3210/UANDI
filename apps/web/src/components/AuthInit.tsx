'use client';

import { useEffect, useState } from 'react';
import { useSetAtom } from 'jotai';
import { WifiOff } from 'lucide-react';
import { Button, EmptyState } from '@uandi/ui';
import { onAuthStateChanged, getRedirectSignInResult } from '@/lib/firebase/auth';
import { setAuthCookie } from '@/lib/auth-cookie';
import { signUpMethod, trackEvent } from '@/lib/analytics';
import { userAtom } from '@/stores/auth.store';
import { createUserDocumentIfAbsent, getOwnUserDocumentWithRetry } from '@/services/user';
import type { User } from '@/types';

// Firebase onAuthStateChanged를 구독하고 userAtom을 업데이트하는 초기화 컴포넌트.
// layout.tsx > Providers > AuthInit 순서로 마운트됩니다.
export function AuthInit() {
  const setUser = useSetAtom(userAtom);
  // 내 users 문서를 끝내 못 읽었을 때 — 신규 가입으로 착각해 문서를 만들지 않고 재시도 화면을 띄운다
  const [loadFailed, setLoadFailed] = useState(false);

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
        setLoadFailed(false);
        return;
      }

      let userDoc: User | null;
      try {
        userDoc = await getOwnUserDocumentWithRetry(firebaseUser.uid);
        if (!userDoc) {
          // 문서가 "확실히 없을 때"만 만든다. 그 사이 생긴 문서가 있으면 덮어쓰지 않고 그대로 쓴다.
          const { user, created } = await createUserDocumentIfAbsent(firebaseUser.uid, {
            email: firebaseUser.email ?? '',
            displayName: firebaseUser.displayName ?? '',
            photoURL: firebaseUser.photoURL ?? null,
            coupleId: null,
          });
          if (created) {
            trackEvent('sign_up', {
              method: signUpMethod(firebaseUser.providerData[0]?.providerId),
            });
          }
          userDoc = user;
        }
      } catch (e) {
        console.error('[AuthInit] 사용자 문서 로드 실패:', e);
        setLoadFailed(true);
        return;
      }

      setLoadFailed(false);
      setAuthCookie(userDoc.coupleId !== null ? 'with_couple' : 'no_couple');
      setUser(userDoc);
    });

    return () => unsubscribe();
  }, [setUser]);

  if (!loadFailed) return null;

  return (
    <div
      data-testid="auth-load-error"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      <EmptyState
        icon={<WifiOff />}
        title="계정 정보를 불러오지 못했어요"
        description="네트워크 연결을 확인한 뒤 다시 시도해 주세요"
        action={
          <Button data-testid="auth-load-error-retry" onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        }
      />
    </div>
  );
}
