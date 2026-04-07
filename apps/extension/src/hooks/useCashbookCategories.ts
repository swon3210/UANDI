import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@uandi/cashbook-core';
import { db } from '@/lib/firebase';

export function useCashbookCategories(coupleId: string | null) {
  return useQuery({
    queryKey: ['cashbookCategories', coupleId],
    queryFn: () => getCategories(db, coupleId!),
    enabled: !!coupleId,
  });
}
