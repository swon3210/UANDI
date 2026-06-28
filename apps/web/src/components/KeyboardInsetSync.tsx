'use client';

import { useEffect } from 'react';

/**
 * 가상 키보드 높이를 추적해 `--keyboard-inset` CSS 변수로 노출한다.
 *
 * 네이티브 Android 앱은 edge-to-edge라 키보드가 떠도 레이아웃 뷰포트가 줄지 않아,
 * 하단 고정 요소(바텀시트)가 키보드에 가려진다. visualViewport로 키보드 높이를 재서
 * 변수에 반영하면, 바텀시트(`SheetContent side="bottom"`)가 그만큼 위로 올라온다.
 *
 * visualViewport(외부 시스템) 구독이라 effect를 사용한다.
 */
export function KeyboardInsetSync(): null {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // 레이아웃 뷰포트(innerHeight)에서 보이는 영역(visualViewport)을 뺀 만큼이 키보드 높이.
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--keyboard-inset', `${Math.round(inset)}px`);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return null;
}
