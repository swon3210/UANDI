import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getCashflowSettings,
  updateCashflowSettings,
  type CashflowSettingsInput,
} from '@/services/cashflow-settings';

const QUERY_KEY = 'cashflowSettings';

export function useCashflowSettings(coupleId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId],
    queryFn: () => getCashflowSettings(coupleId!),
    enabled: !!coupleId,
  });
}

export function useUpdateCashflowSettings(coupleId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CashflowSettingsInput) => updateCashflowSettings(coupleId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] });
      toast.success('시작 현금을 저장했어요.');
    },
    onError: () => {
      toast.error('현금흐름 설정 저장에 실패했어요. 다시 시도해주세요.');
    },
  });
}
