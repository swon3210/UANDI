import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DocumentSnapshot } from 'firebase/firestore';
import {
  createCommunityPost,
  deleteCommunityPost,
  getCommunityFeedPage,
  getCommunityPost,
  reportCommunityPost,
  updateCommunityPost,
  type CreateCommunityPostInput,
  type UpdateCommunityPostInput,
  type CommunityReportReason,
} from '@/services/community';
import type { CommunityPost } from '@/types';

export function useCommunityFeed() {
  return useInfiniteQuery({
    queryKey: ['communityFeed'],
    queryFn: ({ pageParam }) => getCommunityFeedPage(pageParam),
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.posts.length > 0 ? (lastPage.lastDoc ?? undefined) : undefined,
  });
}

export function useCommunityPost(postId: string | null) {
  return useQuery({
    queryKey: ['communityPost', postId],
    queryFn: () => getCommunityPost(postId!),
    enabled: !!postId,
  });
}

export function useCreateCommunityPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommunityPostInput) => createCommunityPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
    },
  });
}

export function useUpdateCommunityPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCommunityPostInput) => updateCommunityPost(input),
    onSuccess: (_v, input) => {
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
      queryClient.invalidateQueries({ queryKey: ['communityPost', input.post.id] });
    },
  });
}

export function useDeleteCommunityPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: CommunityPost) => deleteCommunityPost(post),
    onSuccess: (_v, post) => {
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
      queryClient.invalidateQueries({ queryKey: ['communityPost', post.id] });
    },
  });
}

export function useReportCommunityPost() {
  return useMutation({
    mutationFn: (input: { postId: string; uid: string; reason: CommunityReportReason }) =>
      reportCommunityPost(input),
  });
}
