'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

// @uidotdev/usehooks의 useLocalStorage는 server snapshot에서 throw하기 때문에
// Next.js prerender 시 빌드가 실패한다. useSyncExternalStore로 SSR 시 null을 반환하고
// 클라이언트에선 localStorage 값을 외부 스토어로 구독한다.
function subscribeToStorage(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

export function useSsrSafeLocalStorage<T>(key: string, initialValue: T): [T, (next: T) => void] {
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  }, [key]);

  const stored = useSyncExternalStore(subscribeToStorage, getSnapshot, () => null);

  const value = useMemo<T>(() => {
    if (stored === null) return initialValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return initialValue;
    }
    // initialValue는 caller가 매 렌더 새 객체를 줄 수 있으므로 의존성에서 제외한다.
    // stored가 바뀔 때만 재파싱하면 충분하다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  const setStored = useCallback(
    (next: T) => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
        // 같은 탭 내 다른 hook 인스턴스에도 변경을 알리기 위해 storage 이벤트 수동 발행
        window.dispatchEvent(new StorageEvent('storage', { key }));
      } catch {
        // quota / serialization 오류는 무시
      }
    },
    [key]
  );

  return [value, setStored];
}
