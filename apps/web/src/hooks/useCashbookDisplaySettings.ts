import { useCallback, useSyncExternalStore } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getCashbookDisplaySettings,
  updateCashbookDisplaySettings,
} from '@/services/cashbook-display-settings';

const QUERY_KEY = 'cashbook-display-settings';

export function useCashbookDisplaySettings(userId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => getCashbookDisplaySettings(userId!),
    enabled: !!userId,
  });
}

export function useUpdateCashbookDisplaySettings(userId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { backgroundImageUrl: string | null }) =>
      updateCashbookDisplaySettings(userId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
      toast.success('배경 설정이 저장되었습니다.');
    },
    onError: () => {
      toast.error('배경 설정 저장에 실패했습니다.');
    },
  });
}

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

function getOpacityServerSnapshot() {
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
  const opacity = useSyncExternalStore(
    subscribeOpacity,
    getOpacitySnapshot,
    getOpacityServerSnapshot,
  );

  const setOpacity = useCallback((value: number) => {
    localStorage.setItem(OPACITY_KEY, String(value));
    window.dispatchEvent(
      new StorageEvent('storage', { key: OPACITY_KEY, newValue: String(value) }),
    );
  }, []);

  return [opacity, setOpacity];
}
