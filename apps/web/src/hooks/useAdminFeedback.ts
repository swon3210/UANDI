import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminForbiddenError } from '@/services/admin';
import {
  fetchAdminFeedback,
  updateAdminFeedbackStatus,
  type AdminFeedbackFilter,
} from '@/services/admin-feedback';
import type { FeedbackStatus } from '@/types';

export const ADMIN_FEEDBACK_KEY = 'adminFeedback';

/** 어드민 피드백 목록(최신순 20건씩). 자동 갱신 없이 화면을 열 때와 새로고침 때만 조회. */
export function useAdminFeedback(uid: string | null, filter: AdminFeedbackFilter) {
  return useInfiniteQuery({
    queryKey: [ADMIN_FEEDBACK_KEY, uid, filter],
    queryFn: ({ pageParam }) => fetchAdminFeedback(filter, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: !!uid,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: (count, error) => !(error instanceof AdminForbiddenError) && count < 2,
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
      updateAdminFeedbackStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_FEEDBACK_KEY] }),
  });
}
