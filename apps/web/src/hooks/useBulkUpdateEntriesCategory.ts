'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bulkUpdateEntriesCategory } from '@/services/cashbook';

const QUERY_KEY = 'cashbookEntries';

export function useBulkUpdateEntriesCategory(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryIds,
      newCategoryName,
    }: {
      entryIds: string[];
      newCategoryName: string;
    }) => bulkUpdateEntriesCategory(coupleId!, entryIds, newCategoryName),
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] });
      toast.success(`${count}건 재매칭했어요`);
    },
    onError: () => toast.error('재매칭에 실패했어요. 다시 시도해주세요.'),
  });
}
