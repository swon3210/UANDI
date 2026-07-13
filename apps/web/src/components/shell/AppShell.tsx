'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { type Space } from '@uandi/ui';
import { authStatusAtom } from '@/stores/auth.store';
import { MascotLoader } from '@/components/MascotLoader';

type AppShellProps = {
  space: Space;
  children: React.ReactNode;
};

export function AppShell({ space, children }: AppShellProps) {
  const authStatus = useAtomValue(authStatusAtom);
  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/');
    } else if (authStatus === 'authenticated_no_couple') {
      router.replace('/onboarding');
    }
  }, [authStatus, router]);

  if (
    authStatus === 'loading' ||
    authStatus === 'unauthenticated' ||
    authStatus === 'authenticated_no_couple'
  ) {
    return <MascotLoader fullScreen />;
  }

  // 네비게이션은 헤더 좌측 햄버거(☰) → 좌측 사이드바 드로어(AppSidebarTrigger)로 제공한다.
  return (
    <div data-space={space} className="min-h-screen">
      {children}
    </div>
  );
}
