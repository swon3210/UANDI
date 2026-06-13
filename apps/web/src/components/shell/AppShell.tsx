'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { FullScreenSpinner, cn, type Space } from '@uandi/ui';
import { authStatusAtom } from '@/stores/auth.store';
import { AppNav } from '@/components/shell/AppNav';
import { isChromelessRoute } from '@/components/shell/chromeless-routes';

type AppShellProps = {
  space: Space;
  children: React.ReactNode;
};

export function AppShell({ space, children }: AppShellProps) {
  const authStatus = useAtomValue(authStatusAtom);
  const router = useRouter();
  const pathname = usePathname();
  // 풀스크린(standalone) 플로우는 자체 하단 CTA를 가지므로 전역 하단탭을 숨긴다.
  const chromeless = isChromelessRoute(pathname);

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
      className={cn(
        'min-h-screen',
        // 하단탭이 있을 때만 그 높이만큼 공간을 확보한다.
        !chromeless && 'pb-[calc(4rem+var(--safe-bottom))] md:pb-0 md:pl-20'
      )}
    >
      {children}
      {!chromeless && <AppNav />}
    </div>
  );
}
