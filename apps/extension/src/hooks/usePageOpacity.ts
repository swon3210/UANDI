import { useCallback, useSyncExternalStore } from 'react';

const PAGE_OPACITY_KEY = 'page-opacity';
const DEFAULT_OPACITY = 1;

function getOpacitySnapshot() {
  const stored = localStorage.getItem(PAGE_OPACITY_KEY);
  if (stored !== null) {
    const parsed = Number(stored);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return DEFAULT_OPACITY;
}

function subscribeOpacity(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === PAGE_OPACITY_KEY) callback();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export function usePageOpacity(): [number, (v: number) => void] {
  const opacity = useSyncExternalStore(subscribeOpacity, getOpacitySnapshot);

  const setOpacity = useCallback((value: number) => {
    localStorage.setItem(PAGE_OPACITY_KEY, String(value));
    window.dispatchEvent(
      new StorageEvent('storage', { key: PAGE_OPACITY_KEY, newValue: String(value) }),
    );
  }, []);

  return [opacity, setOpacity];
}
