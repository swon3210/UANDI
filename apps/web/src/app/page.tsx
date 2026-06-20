'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { authStatusAtom } from '@/stores/auth.store';
import { LandingPage } from '@/components/LandingPage';
import { MascotLoader } from '@/components/MascotLoader';

export default function HomePage() {
  const authStatus = useAtomValue(authStatusAtom);
  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'authenticated_no_couple') {
      router.replace('/onboarding');
    } else if (authStatus === 'authenticated_with_couple') {
      router.replace('/inner/cashbook');
    }
  }, [authStatus, router]);

  if (
    authStatus === 'loading' ||
    authStatus === 'authenticated_no_couple' ||
    authStatus === 'authenticated_with_couple'
  ) {
    return <MascotLoader fullScreen />;
  }

  // unauthenticated → 랜딩
  return <LandingPage />;
}
