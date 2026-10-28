'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { recordPath } from '@/lib/nav-history';

/** 앱 내 경로 이동을 nav-history 모듈에 기록한다(BackButton의 back/fallback 판단용). */
export function NavigationTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) recordPath(pathname);
  }, [pathname]);

  return null;
}
