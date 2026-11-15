import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getAssetAllocation, updateAssetAllocation } from '@/services/asset-allocation';
import type { AssetAllocationInput } from '@/types';

const QUERY_KEY = 'asset-allocation';

export function useAssetAllocation(coupleId: string | null, uid: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId, uid],
    queryFn: () => getAssetAllocation(coupleId!, uid!),
    enabled: !!coupleId && !!uid,
  });
}

export function useUpdateAssetAllocation(coupleId: string | null, uid: string | null) {
  const qc = useQueryClient();
  const t = useTranslations('outer.allocation');

  return useMutation({
    mutationFn: (data: AssetAllocationInput) => updateAssetAllocation(coupleId!, uid!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId, uid] });
      toast.success(t('saved'));
    },
    onError: () => {
      toast.error(t('saveFailed'));
    },
  });
}
