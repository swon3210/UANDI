'use client';

import { MessageCircle } from 'lucide-react';
import { CommunityPostCard, EmptyState, Skeleton } from '@uandi/ui';
import type { CommunityPostCardProps } from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { formatRelativeTime } from '@/utils/date';
import type { CommunityPost } from '@/types';

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}

function postToCardProps(post: CommunityPost): CommunityPostCardProps | null {
  const timeLabel = formatRelativeTime(post.publishedAt);
  if (post.type === 'user') {
    if (!post.author) return null;
    return {
      type: 'user',
      author: {
        displayName: post.author.displayName,
        photoURL: post.author.photoURL,
        timeLabel,
      },
      body: post.body,
      imageUrl: post.imageUrl ?? null,
    };
  }
  if (!post.source) return null;
  return {
    type: 'scraped',
    title: post.title,
    body: post.body,
    siteName: post.source.siteName,
    ogImageUrl: post.source.ogImageUrl,
    url: post.source.url,
    timeLabel,
  };
}

export default function CommunityFeedPage() {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useCommunityFeed();

  const sentinelRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const isEmpty = !isLoading && posts.length === 0;

  return (
    <>
      <PageHeader title="커뮤니티" data-testid="community-header" />
      <main className="mx-auto max-w-md px-4 pb-8 pt-4">
        {isLoading ? (
          <FeedSkeleton />
        ) : isEmpty ? (
          <div data-testid="community-empty">
            <EmptyState
              icon={<MessageCircle />}
              title="아직 글이 없어요"
              description="신혼부부들의 이야기가 곧 채워질 거예요."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const props = postToCardProps(post);
              if (!props) return null;
              return <CommunityPostCard key={post.id} {...props} />;
            })}
            {hasNextPage ? <div ref={sentinelRef} className="h-1" /> : null}
            {isFetchingNextPage ? <Skeleton className="h-40 w-full rounded-xl" /> : null}
          </div>
        )}
      </main>
    </>
  );
}
