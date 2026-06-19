import { useEffect, useRef } from 'react';

/**
 * 풀스크린 오버레이가 열려 있는 동안 브라우저/안드로이드 하드웨어 뒤로가기를
 * "오버레이 닫기"로 가로챈다. 페이지 이탈(뒤로 navigate) 대신 onClose를 호출한다.
 *
 * 동작:
 * - 마운트 시 history에 더미 엔트리를 push 해 둔다(현재 URL 유지).
 * - 뒤로가기(popstate)가 발생하면 그 더미가 소비되며 onClose를 호출한다.
 *   더미 URL = 현재 URL 이므로 페이지는 그대로 머무르고 폼만 닫힌다.
 *
 * 참고: 닫기 버튼/저장 등 정상 종료 시에는 더미를 history.back()으로 되감지 않는다.
 * commit 단계에서의 history.back()은 Next App Router의 popstate 처리와 충돌해
 * 진행 중 mutation/리렌더를 깨뜨리기 때문이다. 더미가 1개 남지만 URL이 동일해
 * 다음 뒤로가기는 같은 페이지에 머무는 무해한 동작이 된다.
 *
 * useEffect는 외부 시스템(history/popstate) 동기화이므로 허용된다.
 */
export function useBackButtonClose(onClose: () => void) {
  const onCloseRef = useRef(onClose);

  // 최신 onClose를 ref에 보관(렌더 단계 변형 회피 — React Compiler 호환).
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    window.history.pushState({ uandiOverlay: true }, '');

    const handlePop = () => {
      onCloseRef.current();
    };
    window.addEventListener('popstate', handlePop);

    return () => {
      window.removeEventListener('popstate', handlePop);
    };
  }, []);
}
