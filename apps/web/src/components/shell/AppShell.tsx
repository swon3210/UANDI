'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { FullScreenSpinner, type Space } from '@uandi/ui';
import { authStatusAtom } from '@/stores/auth.store';
import { AppNav } from '@/components/shell/AppNav';

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
    return <FullScreenSpinner />;
  }

  return (
    <div
      data-space={space}
      className="min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-20"
    >
      {children}
      <AppNav />
    </div>
  );
}
