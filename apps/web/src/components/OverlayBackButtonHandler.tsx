'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { overlay, useOverlayData } from 'overlay-kit';

/**
 * 전역 뒤로가기 가드.
 * 바텀시트/다이얼로그(overlay-kit)가 떠 있을 때 안드로이드 하드웨어/브라우저 뒤로가기를
 * "페이지 이동"이 아니라 "최상단 오버레이 닫기"로 가로챈다. 호출부 코드는 건드리지 않는다.
 *
 * 동작:
 * - 오버레이가 하나라도 열려 있는데 history 더미가 없으면 pushState(현재 URL 유지)로 더미를 하나 만든다.
 * - popstate(뒤로가기)가 발생하면 그 더미가 소비된다. 열린 오버레이가 있으면 최상단을 overlay.close 한다.
 *   남은 오버레이가 있으면 다음 렌더의 effect가 더미를 다시 만든다.
 *
 * 왜 pushState만 쓰고 history.back()/go()는 안 쓰나:
 * 정상 닫기(저장/닫기 버튼) 시 더미를 history.back()으로 되감으면 Next App Router의 popstate 처리가
 * 진행 중 mutation/리렌더를 깨뜨린다(과거 E2E 12건 실패 이력). 그래서 더미는 "소비"만 하고 강제로
 * 되감지 않는다. 더미 URL=현재 URL이라 남아도 무해하며, 더미를 전역에서 1개만 유지·재사용하므로
 * 페이지를 떠날 때 발생하는 "헛 뒤로가기"는 최대 한 번뿐이다.
 *
 * useEffect는 외부 시스템(history/popstate) 동기화이므로 허용된다.
 */
export function OverlayBackButtonHandler() {
  const data = useOverlayData();
  // 화면에 떠 있는(isOpen) 오버레이만, 열린 순서대로(마지막 = 최상단).
  const openIds = Object.values(data)
    .filter((o) => o.isOpen)
    .map((o) => o.id);
  const openCount = openIds.length;

  // popstate 핸들러가 항상 최신 목록을 읽도록 ref에 동기화.
  const openIdsRef = useRef<string[]>(openIds);
  openIdsRef.current = openIds;

  // 우리가 만든 history 더미가 (현재 페이지 기준) 살아 있는지.
  const hasDummyRef = useRef(false);

  // 페이지가 바뀌면(client navigation) 직전 페이지에 남겨둔 더미는 더 이상 유효하지 않다.
  // 플래그를 리셋해, 새 페이지에서 오버레이를 열 때 더미를 새로 만들도록 한다.
  // (안 하면 직전 더미를 재사용하려다 뒤로가기가 닫기 대신 페이지 이동을 한다.)
  const pathname = usePathname();
  useEffect(() => {
    hasDummyRef.current = false;
  }, [pathname]);

  // 오버레이가 열려 있는데 더미가 없으면 하나 만든다(pushState만 — back/go 금지).
  useEffect(() => {
    if (openCount > 0 && !hasDummyRef.current) {
      window.history.pushState({ uandiOverlay: true }, '');
      hasDummyRef.current = true;
    }
  }, [openCount]);

  // 네이티브 앱(WebView)에 오버레이 열림 여부를 알린다.
  // 네이티브 하드웨어 백버튼은 canGoBack(=RN WebView navState)으로 동작 여부를 판단하는데,
  // pushState는 onNavigationStateChange를 발생시키지 않아 네이티브가 더미를 인지하지 못한다.
  // 그래서 열림 상태를 직접 통지해, 네이티브가 "오버레이 닫기 vs 페이지 뒤로/앱 종료"를 고른다.
  const hasOverlayOpen = openCount > 0;
  useEffect(() => {
    const rn = (
      window as unknown as { ReactNativeWebView?: { postMessage: (msg: string) => void } }
    ).ReactNativeWebView;
    rn?.postMessage(JSON.stringify({ type: 'overlay-state', open: hasOverlayOpen }));
  }, [hasOverlayOpen]);

  useEffect(() => {
    const handlePop = () => {
      // 뒤로가기로 더미가 이미 소비됐다.
      hasDummyRef.current = false;

      const ids = openIdsRef.current;
      if (ids.length === 0) return; // 열린 오버레이 없음 → 페이지에 머무름(무해한 헛 뒤로가기).

      // 최상단 오버레이를 닫는다.
      const top = ids[ids.length - 1];
      overlay.close(top);
      // Radix는 controlled prop 변경 시 onOpenChange를 호출하지 않아 호출부의 자동 unmount가
      // 안 탈 수 있다 → 닫힘 애니메이션 후 직접 unmount 한다(이미 unmount면 no-op).
      window.setTimeout(() => overlay.unmount(top), 300);
      // 남은 오버레이가 있으면 다음 렌더의 effect가 더미를 다시 push 한다.
    };

    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  return null;
}
