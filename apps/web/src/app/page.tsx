'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { FullScreenSpinner } from '@uandi/ui';
import { authStatusAtom } from '@/stores/auth.store';
import { LandingPage } from '@/components/LandingPage';

export default function HomePage() {
  const authStatus = useAtomValue(authStatusAtom);
  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'authenticated_no_couple') {
      router.replace('/onboarding');
    } else if (authStatus === 'authenticated_with_couple') {
      router.replace('/inner');
    }
  }, [authStatus, router]);

  if (
    authStatus === 'loading' ||
    authStatus === 'authenticated_no_couple' ||
    authStatus === 'authenticated_with_couple'
  ) {
    return <FullScreenSpinner />;
  }

  // unauthenticated → 랜딩
  return <LandingPage />;
}
