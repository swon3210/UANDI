import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getPredictionsInRange,
  getActivePredictions,
  addPrediction,
  confirmPrediction,
  rejectPrediction,
  dismissPrompt,
  deletePrediction,
  type ConfirmOverride,
} from '@/services/predictions';
import type { CashbookPrediction } from '@/types';

const QUERY_KEY = 'cashbookPredictions';
// useCashbook.ts의 QUERY_KEY와 동일해야 한다(✓ 확정이 cashbookEntries 캐시에 영향).
const CASHBOOK_ENTRIES_KEY = 'cashbookEntries';

export function usePredictionsInRange(coupleId: string | null, start: Date, end: Date) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId, 'range', start.toISOString(), end.toISOString()],
    queryFn: () => getPredictionsInRange(coupleId!, start, end),
    enabled: !!coupleId,
  });
}

export function useActivePredictions(coupleId: string | null, from: Date) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId, 'active', from.toISOString()],
    queryFn: () => getActivePredictions(coupleId!, from),
    enabled: !!coupleId,
  });
}

export function useAddPrediction(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CashbookPrediction, 'id' | 'coupleId' | 'createdAt' | 'updatedAt'>) =>
      addPrediction(coupleId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
    onError: () => toast.error('예측 추가에 실패했어요. 다시 시도해주세요.'),
  });
}

export function useConfirmPrediction(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      prediction,
      override,
    }: {
      prediction: CashbookPrediction;
      override?: ConfirmOverride;
    }) => confirmPrediction(coupleId!, prediction, override),
    onSuccess: () => {
      // ✓ 확정은 예측 doc과 실거래를 동시에 바꾸므로 양쪽 캐시를 모두 무효화한다.
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] });
      qc.invalidateQueries({ queryKey: [CASHBOOK_ENTRIES_KEY, coupleId] });
    },
    onError: () => toast.error('예측 확정에 실패했어요. 다시 시도해주세요.'),
  });
}

export function useRejectPrediction(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (predictionId: string) => rejectPrediction(coupleId!, predictionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
    onError: () => toast.error('예측 거절에 실패했어요. 다시 시도해주세요.'),
  });
}

/** ✗ 가계부 프롬프트만 닫기(calendar 출처). 캘린더 예측은 유지. */
export function useDismissPrompt(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (predictionId: string) => dismissPrompt(coupleId!, predictionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
    onError: () => toast.error('처리에 실패했어요. 다시 시도해주세요.'),
  });
}

export function useDeletePrediction(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (predictionId: string) => deletePrediction(coupleId!, predictionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
    onError: () => toast.error('예측 삭제에 실패했어요. 다시 시도해주세요.'),
  });
}
