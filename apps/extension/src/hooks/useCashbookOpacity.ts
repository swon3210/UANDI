import { useCallback, useSyncExternalStore } from 'react';

const OPACITY_KEY = 'cashbook-opacity';
const DEFAULT_OPACITY = 1;

function getOpacitySnapshot() {
  const stored = localStorage.getItem(OPACITY_KEY);
  if (stored !== null) {
    const parsed = Number(stored);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return DEFAULT_OPACITY;
}

function subscribeOpacity(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === OPACITY_KEY) callback();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export function useCashbookOpacity(): [number, (v: number) => void] {
  const opacity = useSyncExternalStore(subscribeOpacity, getOpacitySnapshot);

  const setOpacity = useCallback((value: number) => {
    localStorage.setItem(OPACITY_KEY, String(value));
    window.dispatchEvent(
      new StorageEvent('storage', { key: OPACITY_KEY, newValue: String(value) }),
    );
  }, []);

  return [opacity, setOpacity];
}
