'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { FullScreenSpinner } from '@uandi/ui';
import { authStatusAtom } from '@/stores/auth.store';
import { LandingPage } from '@/components/LandingPage';
import { Dashboard } from '@/components/dashboard/Dashboard';

export default function HomePage() {
  const authStatus = useAtomValue(authStatusAtom);
  const router = useRouter();

  // middleware 쿠키 미설정 gap을 위한 fallback: 커플 미연결 시 클라이언트에서도 리다이렉트
  useEffect(() => {
    if (authStatus === 'authenticated_no_couple') {
      router.replace('/onboarding');
    }
  }, [authStatus, router]);

  if (authStatus === 'loading' || authStatus === 'authenticated_no_couple') {
    return <FullScreenSpinner />;
  }

  if (authStatus === 'unauthenticated') {
    return <LandingPage />;
  }

  // authenticated_with_couple → 대시보드
  return <Dashboard />;
}
