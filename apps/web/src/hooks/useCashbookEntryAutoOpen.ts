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
/** 대시보드가 한 번 그려진 뒤 투어를 띄우기까지의 지연. 커플 카드·빈 화면을 먼저 보게 한다. */
export const TOUR_OPEN_DELAY_MS = 1500;

/**
 * 가계부(대시보드) 진입 시 일회성 안내를 자동으로 연다. 한 번 진입에 하나만 띄운다.
 * 1. 첫 진입 → 온보딩 투어 1회 (화면이 그려지고 TOUR_OPEN_DELAY_MS 뒤에. 그 전에 떠나면 다음 진입에 다시 시도)
 * 2. 그 이후, 올해 경제 목표가 아직 없으면 → 목표 설정(위저드) 화면으로 연 1회 이동
 *    (그 뒤로 목표는 가계부 설정 → 경제 목표에서 찾아 들어간다)
 * localStorage 플래그(외부 시스템)에 반응하는 일회성 동작이라 effect + ref 가드를 사용한다.
 * 투어를 전체 사용자에게 재노출하려면 키 버전을 올린다(moa:tour:v2).
 */
export function useCashbookEntryAutoOpen(coupleId: string | null, partnerName: string | null) {
  const router = useRouter();
  const year = dayjs().year();
  const [tourSeen, setTourSeen] = useSsrSafeLocalStorage<boolean>(TOUR_SEEN_KEY, false);
  const [planPrompted, setPlanPrompted] = useSsrSafeLocalStorage<boolean>(
    `${ANNUAL_PLAN_PROMPT_KEY_PREFIX}${year}`,
    false
  );
  const { data: plan, isPending: planPending } = useAnnualPlan(coupleId, year);
  const handledRef = useRef(false);
  // 투어 문구에 쓸 짝꿍 이름 — 타이머가 도는 동안 바뀌어도 구독을 다시 걸지 않는다
  const partnerNameRef = useRef(partnerName);
  useEffect(() => {
    partnerNameRef.current = partnerName;
  }, [partnerName]);

  useEffect(() => {
    if (!coupleId || handledRef.current) return;

    if (!tourSeen) {
      const timer = setTimeout(() => {
        if (handledRef.current) return;
        handledRef.current = true; // StrictMode 더블마운트 / 리렌더 가드
        setTourSeen(true); // 열리는 순간에 기록 → 그 전에 떠나면 다음 진입에 다시 시도
        openServiceTour({ partnerName: partnerNameRef.current });
      }, TOUR_OPEN_DELAY_MS);
      return () => clearTimeout(timer);
    }

    if (planPending) return;
    handledRef.current = true;
    if (plan || planPrompted) return;
    // 위저드가 진입 즉시 plan을 생성하므로, 중간에 나가도 이후 진입에선 plan 존재로 다시 뜨지 않는다.
    // 플래그는 plan 생성 전에 이탈한 경우를 위한 보조 가드다.
    setPlanPrompted(true);
    router.push(WIZARD_INTRO);
  }, [coupleId, tourSeen, setTourSeen, plan, planPending, planPrompted, setPlanPrompted, router]);
}
