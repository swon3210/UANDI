'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/stores/auth.store';
import { identifyUser, trackPageView } from '@/lib/analytics';

/** 경로 변경을 page_view 로, 로그인 사용자를 user_id 로 GA4에 동기화한다(docs/09-analytics.md). */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;
  const hasCouple = user?.coupleId != null;

  useEffect(() => {
    identifyUser(uid ? { uid, hasCouple } : null);
  }, [uid, hasCouple]);

  useEffect(() => {
    if (pathname) trackPageView(pathname);
  }, [pathname]);

  return null;
}
