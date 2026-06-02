'use client';

import { useAtomValue } from 'jotai';
import { MessageCircle, Pencil } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import {
  Button,
  CommunityComposer,
  CommunityPostCard,
  EmptyState,
  ReportMenu,
  Sheet,
  Skeleton,
  type CommunityPostCardProps,
  type ReportReason,
} from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import { CommunityDeleteConfirmDialog } from '@/components/community/CommunityDeleteConfirmDialog';
import { CommunityReportDialog } from '@/components/community/CommunityReportDialog';
import {
  useCommunityFeed,
  useCreateCommunityPost,
  useDeleteCommunityPost,
  useReportCommunityPost,
  useUpdateCommunityPost,
} from '@/hooks/useCommunityFeed';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { userAtom } from '@/stores/auth.store';
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

function postToCardProps(
  post: CommunityPost,
  actionSlot: React.ReactNode
): CommunityPostCardProps | null {
  const baseTime = formatRelativeTime(post.publishedAt);
  const timeLabel = post.editedAt ? `${baseTime} · 수정됨` : baseTime;
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
      actionSlot,
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
    actionSlot,
  };
}

export default function CommunityFeedPage() {
  const user = useAtomValue(userAtom);
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useCommunityFeed();
  const createMutation = useCreateCommunityPost();
  const updateMutation = useUpdateCommunityPost();
  const deleteMutation = useDeleteCommunityPost();
  const reportMutation = useReportCommunityPost();

  const sentinelRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const isEmpty = !isLoading && posts.length === 0;

  const openComposer = () => {
    if (!user) return;
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CommunityComposer
          onSubmit={async ({ body, imageFile }) => {
            try {
              await createMutation.mutateAsync({
                body,
                imageFile,
                author: {
                  uid: user.uid,
                  coupleId: user.coupleId,
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                },
              });
              toast.success('글이 올라갔어요');
              close();
              setTimeout(unmount, 300);
            } catch {
              toast.error('글을 올리지 못했어요. 잠시 후 다시 시도해주세요.');
            }
          }}
        />
      </Sheet>
    ));
  };

  const openEditComposer = (post: CommunityPost) => {
    if (!user) return;
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CommunityComposer
          mode="edit"
          initialBody={post.body}
          initialImageUrl={post.imageUrl ?? null}
          onSubmit={async ({ body, imageFile, imageRemoved }) => {
            try {
              await updateMutation.mutateAsync({ post, body, imageFile, imageRemoved });
              toast.success('글을 수정했어요');
              close();
              setTimeout(unmount, 300);
            } catch {
              toast.error('글을 수정하지 못했어요. 잠시 후 다시 시도해주세요.');
            }
          }}
        />
      </Sheet>
    ));
  };

  const openReportDialog = async (post: CommunityPost) => {
    if (!user) return;
    const reason = await overlay.openAsync<ReportReason | null>(({ isOpen, close, unmount }) => (
      <CommunityReportDialog
        isOpen={isOpen}
        onSubmit={(r) => {
          close(r);
          setTimeout(unmount, 300);
        }}
        onCancel={() => {
          close(null);
          setTimeout(unmount, 300);
        }}
      />
    ));
    if (!reason) return;

    try {
      await reportMutation.mutateAsync({ postId: post.id, uid: user.uid, reason });
      toast.success('신고가 접수됐어요');
    } catch (err) {
      // Firestore rule이 update를 deny → 두 번째 신고 시도면 PERMISSION_DENIED
      const code = (err as { code?: string } | null)?.code ?? '';
      if (code === 'permission-denied') {
        toast.error('이미 신고한 글이에요');
      } else {
        toast.error('신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  const openDeleteConfirm = async (post: CommunityPost) => {
    const confirmed = await overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
      <CommunityDeleteConfirmDialog
        isOpen={isOpen}
        onConfirm={() => {
          close(true);
          setTimeout(unmount, 300);
        }}
        onCancel={() => {
          close(false);
          setTimeout(unmount, 300);
        }}
      />
    ));
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(post);
      toast.success('글을 삭제했어요');
    } catch {
      toast.error('삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <>
      <PageHeader
        title="커뮤니티"
        data-testid="community-header"
        rightSlot={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="글쓰기"
            data-testid="community-write"
            onClick={openComposer}
          >
            <Pencil size={18} />
          </Button>
        }
      />
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
              const isOwner =
                post.type === 'user' && !!user && post.author?.uid === user.uid;
              // 본인 글: 수정+삭제, 타인 글/스크랩: 신고만. (community-feed.md 액션 메뉴)
              const actionSlot = isOwner ? (
                <ReportMenu
                  onEdit={() => openEditComposer(post)}
                  onDelete={() => openDeleteConfirm(post)}
                />
              ) : user ? (
                <ReportMenu onReport={() => openReportDialog(post)} />
              ) : null;
              const props = postToCardProps(post, actionSlot);
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
