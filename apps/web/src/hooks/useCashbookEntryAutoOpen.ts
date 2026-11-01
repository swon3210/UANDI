'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSsrSafeLocalStorage } from './useSsrSafeLocalStorage';
import { openServiceTour } from '@/components/tutorial/openServiceTour';

const TOUR_SEEN_KEY = 'moa:tour:v1';
/** 대시보드가 한 번 그려진 뒤 투어를 띄우기까지의 지연. 커플 카드·빈 화면을 먼저 보게 한다. */
export const TOUR_OPEN_DELAY_MS = 1500;

export type CashbookEntryContext = {
  /** 짝꿍 표시 이름. 없으면 null */
  partnerName: string | null;
  /** 내역이 하나라도 있는지. 아직 모르면 null(로딩 중) */
  hasEntries: boolean | null;
};

/**
 * 가계부(대시보드) 첫 진입 시 온보딩 투어를 1회 자동으로 연다.
 * 화면이 그려지고 TOUR_OPEN_DELAY_MS 뒤에, 내역 유무를 알게 된 다음에 연다(2장 문구가 상태에 맞게).
 * 열리는 순간에 seen을 기록하므로 그 전에 떠나면 다음 진입에 다시 시도한다.
 * (예전의 "올해 목표 없으면 위저드로 연 1회 자동 이동"은 폐지 — 대시보드 예산 권유 카드로 대체)
 * localStorage 플래그(외부 시스템)에 반응하는 일회성 동작이라 effect + ref 가드를 사용한다.
 * 투어를 전체 사용자에게 재노출하려면 키 버전을 올린다(moa:tour:v2).
 */
export function useCashbookEntryAutoOpen(coupleId: string | null, context: CashbookEntryContext) {
  const router = useRouter();
  const [tourSeen, setTourSeen] = useSsrSafeLocalStorage<boolean>(TOUR_SEEN_KEY, false);
  const handledRef = useRef(false);
  // 투어 문구에 쓸 맥락 — 타이머가 도는 동안 바뀌어도 구독을 다시 걸지 않는다
  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const ready = context.hasEntries !== null;

  useEffect(() => {
    if (!coupleId || handledRef.current || tourSeen || !ready) return;

    const timer = setTimeout(() => {
      if (handledRef.current) return;
      handledRef.current = true; // StrictMode 더블마운트 / 리렌더 가드
      setTourSeen(true); // 열리는 순간에 기록 → 그 전에 떠나면 다음 진입에 다시 시도
      openServiceTour({
        partnerName: contextRef.current.partnerName,
        hasEntries: contextRef.current.hasEntries === true,
        onViewEntries: () => router.push('/inner/cashbook/history'),
      });
    }, TOUR_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [coupleId, tourSeen, setTourSeen, ready, router]);
}
