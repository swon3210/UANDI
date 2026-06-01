import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { checkIsAdmin } from '@/lib/community/admin';
import {
  fetchModerationLists,
  moderateCommunityPost,
  type ModerateAction,
} from '@/services/community-admin';
import { userAtom } from '@/stores/auth.store';

/**
 * 본인이 admin인지 판정.
 * undefined = 로딩 / true = admin / false = 일반 유저
 * 페이지 가드용 — 서버 검증은 별개.
 */
export function useIsAdmin() {
  const user = useAtomValue(userAtom);
  return useQuery({
    queryKey: ['isAdmin', user?.uid ?? null],
    queryFn: () => checkIsAdmin(user!.uid),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useModerationLists(enabled: boolean) {
  return useQuery({
    queryKey: ['moderationLists'],
    queryFn: fetchModerationLists,
    enabled,
    staleTime: 0,
  });
}

export function useModeratePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { postId: string; action: ModerateAction }) =>
      moderateCommunityPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationLists'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
    },
  });
}
