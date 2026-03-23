import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCashBalances, upsertCashBalance } from '@/services/cash-balance';
import type { CashBalance } from '@/types';

const QUERY_KEY = 'cashBalances';

export function useCashBalances(
  coupleId: string | null,
  year: number,
  month: number // 1~12
) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId, year, month],
    queryFn: () => getCashBalances(coupleId!, year, month),
    enabled: !!coupleId,
  });
}

export function useUpsertCashBalance(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CashBalance, 'id' | 'updatedAt'>) => upsertCashBalance(coupleId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] });
      toast.success('잔고가 업데이트되었어요.');
    },
    onError: () => toast.error('잔고 업데이트에 실패했어요.'),
  });
}
