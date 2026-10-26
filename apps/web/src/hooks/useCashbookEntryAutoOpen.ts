'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useSsrSafeLocalStorage } from './useSsrSafeLocalStorage';
import { useAnnualPlan } from './useAnnualPlan';
import { openServiceTour } from '@/components/tutorial/openServiceTour';

const TOUR_SEEN_KEY = 'moa:tour:v1';
const ANNUAL_PLAN_PROMPT_KEY_PREFIX = 'moa:annual-plan-prompt:';
const WIZARD_INTRO = '/inner/cashbook/plan/annual/wizard?step=intro';

/**
 * 가계부(대시보드) 진입 시 일회성 안내를 자동으로 연다. 한 번 진입에 하나만 띄운다.
 * 1. 첫 진입 → 말랑 가계부 온보딩 투어 1회
 * 2. 그 이후, 올해 경제 목표가 아직 없으면 → 목표 설정(위저드) 화면으로 연 1회 이동
 *    (그 뒤로 목표는 가계부 설정 → 경제 목표에서 찾아 들어간다)
 * localStorage 플래그(외부 시스템)에 반응하는 일회성 동작이라 effect + ref 가드를 사용한다.
 * 투어를 전체 사용자에게 재노출하려면 키 버전을 올린다(moa:tour:v2).
 */
export function useCashbookEntryAutoOpen(coupleId: string | null) {
  const router = useRouter();
  const year = dayjs().year();
  const [tourSeen, setTourSeen] = useSsrSafeLocalStorage<boolean>(TOUR_SEEN_KEY, false);
  const [planPrompted, setPlanPrompted] = useSsrSafeLocalStorage<boolean>(
    `${ANNUAL_PLAN_PROMPT_KEY_PREFIX}${year}`,
    false
  );
  const { data: plan, isPending: planPending } = useAnnualPlan(coupleId, year);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!coupleId || handledRef.current) return;

    if (!tourSeen) {
      handledRef.current = true; // StrictMode 더블마운트 / 리렌더 가드
      setTourSeen(true); // 플래그를 먼저 기록해 더블오픈 방지
      openServiceTour();
      return;
    }

    if (planPending) return;
    handledRef.current = true;
    if (plan || planPrompted) return;
    setPlanPrompted(true);
    router.push(WIZARD_INTRO);
  }, [coupleId, tourSeen, setTourSeen, plan, planPending, planPrompted, setPlanPrompted, router]);
}
