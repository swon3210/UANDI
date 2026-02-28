'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { Loader2 } from 'lucide-react';
import { authStatusAtom } from '@/stores/auth.store';
import { LandingPage } from '@/components/LandingPage';

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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return <LandingPage />;
  }

  // authenticated_with_couple → 대시보드 (docs/pages/02-dashboard.md 구현 예정)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <p className="text-muted-foreground">대시보드 준비 중...</p>
    </main>
  );
}
