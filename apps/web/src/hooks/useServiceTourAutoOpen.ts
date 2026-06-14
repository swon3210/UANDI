'use client';

import { useEffect, useRef } from 'react';
import { useSsrSafeLocalStorage } from './useSsrSafeLocalStorage';
import { openServiceTour } from '@/components/tutorial/openServiceTour';

const TOUR_SEEN_KEY = 'moa:tour:v1';

/**
 * 첫 대시보드 진입 시 MOA 온보딩 투어를 1회 자동으로 연다.
 * localStorage 플래그(외부 시스템)에 반응하는 일회성 동작이라 effect + ref 가드를 사용한다.
 * (cashbook/history 의 quickAdd 핸들러와 동일한 패턴)
 * 추후 전체 사용자에게 재노출하려면 키 버전을 올린다(moa:tour:v2).
 */
export function useServiceTourAutoOpen(enabled: boolean) {
  const [seen, setSeen] = useSsrSafeLocalStorage<boolean>(TOUR_SEEN_KEY, false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!enabled || handledRef.current || seen) return;
    handledRef.current = true; // StrictMode 더블마운트 / 리렌더 가드
    setSeen(true); // 플래그를 먼저 기록해 더블오픈 방지
    openServiceTour();
  }, [enabled, seen, setSeen]);
}
