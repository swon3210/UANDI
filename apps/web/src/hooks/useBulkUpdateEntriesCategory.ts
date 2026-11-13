'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { bulkUpdateEntriesCategory } from '@/services/cashbook';

const QUERY_KEY = 'cashbookEntries';

export function useBulkUpdateEntriesCategory(coupleId: string | null) {
  const t = useTranslations('cashbook.misc');
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryIds, newCategoryName }: { entryIds: string[]; newCategoryName: string }) =>
      bulkUpdateEntriesCategory(coupleId!, entryIds, newCategoryName),
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] });
      toast.success(t('remapped', { count }));
    },
    onError: () => toast.error(t('remapFailed')),
  });
}
