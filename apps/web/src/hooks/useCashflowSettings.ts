import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('cashbook.cashflow.settings');
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CashflowSettingsInput) => updateCashflowSettings(coupleId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] });
      toast.success(t('saved'));
    },
    onError: () => {
      toast.error(t('saveFailed'));
    },
  });
}
