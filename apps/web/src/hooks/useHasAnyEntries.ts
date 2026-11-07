import { useQuery } from '@tanstack/react-query';
import { getLatestEntryDate } from '@/services/cashbook';

/** 커플에 내역이 하나라도 있는지(최근 1건 조회). 투어 문구를 상태에 맞추는 데 쓴다. */
export function useHasAnyEntries(coupleId: string | null) {
  return useQuery({
    queryKey: ['hasAnyEntries', coupleId],
    queryFn: async () => (await getLatestEntryDate(coupleId!)) !== null,
    enabled: !!coupleId,
    staleTime: 60 * 1000,
  });
}
