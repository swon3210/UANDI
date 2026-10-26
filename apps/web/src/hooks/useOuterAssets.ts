import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  addOuterAssets,
  deleteOuterAsset,
  listOuterAssets,
  updateOuterAsset,
  type OuterAssetCollection,
} from '@/services/outer-assets';
import { fetchAptTrades, fetchStockQuotes } from '@/services/investment-api';
import type { RealEstateHoldingInput, SavingsAccountInput, StockHoldingInput } from '@/types';

const QUERY_KEY = 'outer-assets';

const LABELS: Record<OuterAssetCollection, string> = {
  savings: '예적금',
  stockHoldings: '종목',
  realEstateHoldings: '부동산',
};

type InputOf<K extends OuterAssetCollection> = K extends 'savings'
  ? SavingsAccountInput
  : K extends 'stockHoldings'
    ? StockHoldingInput
    : RealEstateHoldingInput;

export function useOuterAssets<K extends OuterAssetCollection>(
  coupleId: string | null,
  uid: string | null,
  name: K
) {
  return useQuery({
    queryKey: [QUERY_KEY, name, coupleId, uid],
    queryFn: () => listOuterAssets(coupleId!, uid!, name),
    enabled: !!coupleId && !!uid,
  });
}

export function useOuterAssetMutations<K extends OuterAssetCollection>(
  coupleId: string | null,
  uid: string | null,
  name: K
) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [QUERY_KEY, name, coupleId, uid] });
  const label = LABELS[name];

  const add = useMutation({
    mutationFn: (inputs: InputOf<K>[]) => addOuterAssets(coupleId!, uid!, name, inputs as never),
    onSuccess: (_data, inputs) => {
      invalidate();
      toast.success(inputs.length > 1 ? `${label} ${inputs.length}개를 추가했어요` : '저장했어요');
    },
    onError: () => toast.error(`${label} 저장에 실패했어요`),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: InputOf<K> }) =>
      updateOuterAsset(coupleId!, uid!, name, id, input as never),
    onSuccess: () => {
      invalidate();
      toast.success('수정했어요');
    },
    onError: () => toast.error(`${label} 수정에 실패했어요`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteOuterAsset(coupleId!, uid!, name, id),
    onSuccess: () => {
      invalidate();
      toast.success('삭제했어요');
    },
    onError: () => toast.error(`${label} 삭제에 실패했어요`),
  });

  return { add, update, remove };
}

export function useStockQuotes(keys: string[]) {
  const sorted = [...new Set(keys)].sort();
  return useQuery({
    queryKey: ['stock-quotes', sorted],
    queryFn: () => fetchStockQuotes(sorted),
    enabled: sorted.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useAptTrades(lawdCd: string | null, aptName: string | null) {
  return useQuery({
    queryKey: ['apt-trades', lawdCd, aptName],
    queryFn: () => fetchAptTrades(lawdCd!, aptName!),
    enabled: !!lawdCd && !!aptName,
    // 실거래 신고는 하루 단위 갱신 — 클라이언트도 길게 캐시
    staleTime: 6 * 60 * 60 * 1000,
    retry: 1,
  });
}
