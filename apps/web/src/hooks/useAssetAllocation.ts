import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

  return useMutation({
    mutationFn: (data: AssetAllocationInput) => updateAssetAllocation(coupleId!, uid!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId, uid] });
      toast.success('자산 배분 비율이 저장되었습니다.');
    },
    onError: () => {
      toast.error('자산 배분 비율 저장에 실패했습니다.');
    },
  });
}
