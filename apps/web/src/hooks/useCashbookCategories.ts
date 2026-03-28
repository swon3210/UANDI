import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  initDefaultCategories,
} from '@/services/cashbook-categories';
import type { CashbookCategory, CategoryGroup } from '@/types';

const QUERY_KEY = 'cashbookCategories';

export function useCashbookCategories(coupleId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, coupleId],
    queryFn: () => getCategories(coupleId!),
    enabled: !!coupleId,
  });
}

export function filterCategoriesByGroup(
  categories: CashbookCategory[] | undefined,
  group: CategoryGroup
) {
  if (!categories) return [];
  return categories.filter((c) => c.group === group);
}

export function useAddCategory(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CashbookCategory, 'id' | 'coupleId' | 'createdAt'>) =>
      addCategory(coupleId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
    onError: () => toast.error('카테고리 추가에 실패했습니다'),
  });
}

export function useUpdateCategory(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: Partial<Pick<CashbookCategory, 'name' | 'icon' | 'color' | 'subGroup' | 'sortOrder'>>;
    }) => updateCategory(coupleId!, categoryId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
    onError: () => toast.error('카테고리 수정에 실패했습니다'),
  });
}

export function useDeleteCategory(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(coupleId!, categoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
    onError: () => toast.error('카테고리 삭제에 실패했습니다'),
  });
}

export function useInitDefaultCategories(coupleId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => initDefaultCategories(coupleId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, coupleId] }),
  });
}
