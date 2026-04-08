'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalStorage } from '@uidotdev/usehooks';
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

export function useCashbookOpacity(): [number, (v: number) => void] {
  const [opacity, setOpacity] = useLocalStorage(OPACITY_KEY, DEFAULT_OPACITY);

  const handleSetOpacity = useCallback(
    (value: number) => {
      setOpacity(value);
    },
    [setOpacity],
  );

  return [opacity, handleSetOpacity];
}
