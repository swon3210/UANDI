import { useInfiniteQuery } from '@tanstack/react-query';
import type { DocumentSnapshot } from 'firebase/firestore';
import { getCommunityFeedPage } from '@/services/community';

export function useCommunityFeed() {
  return useInfiniteQuery({
    queryKey: ['communityFeed'],
    queryFn: ({ pageParam }) => getCommunityFeedPage(pageParam),
    initialPageParam: undefined as DocumentSnapshot | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.posts.length > 0 ? (lastPage.lastDoc ?? undefined) : undefined,
  });
}
