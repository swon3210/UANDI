'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useAtomValue } from 'jotai';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import {
  CommunityComposer,
  FullScreenSpinner,
  PostAuthor,
  ReportMenu,
  Sheet,
} from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import { CommunityDeleteConfirmDialog } from '@/components/community/CommunityDeleteConfirmDialog';
import {
  useCommunityPost,
  useDeleteCommunityPost,
  useUpdateCommunityPost,
} from '@/hooks/useCommunityFeed';
import { userAtom } from '@/stores/auth.store';
import { formatRelativeTime } from '@/utils/date';
import type { CommunityPost } from '@/types';

export default function CommunityPostDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params.id ?? null;
  const user = useAtomValue(userAtom);

  const { data: post, isLoading } = useCommunityPost(postId);
  const updateMutation = useUpdateCommunityPost();
  const deleteMutation = useDeleteCommunityPost();

  if (isLoading) {
    return <FullScreenSpinner />;
  }

  // 스크랩 글은 상세 페이지가 없다(메타데이터+링크아웃만). user 글이 아니면 404.
  if (!post || post.type !== 'user') {
    notFound();
  }

  const userPost: CommunityPost = post;
  const isOwner = !!user && userPost.author?.uid === user.uid;

  const openEditComposer = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CommunityComposer
          mode="edit"
          initialBody={userPost.body}
          initialImageUrl={userPost.imageUrl ?? null}
          onSubmit={async ({ body, imageFile, imageRemoved }) => {
            try {
              await updateMutation.mutateAsync({ post: userPost, body, imageFile, imageRemoved });
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

  const openDeleteConfirm = async () => {
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
      await deleteMutation.mutateAsync(userPost);
      toast.success('글을 삭제했어요');
      router.push('/community');
    } catch {
      toast.error('삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <>
      <PageHeader title="글" />
      <main className="mx-auto max-w-md px-4 pb-8 pt-4">
        <article
          data-testid="community-post-detail"
          className="space-y-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-2">
            {userPost.author ? (
              <PostAuthor
                displayName={userPost.author.displayName}
                photoURL={userPost.author.photoURL}
                timeLabel={
                  userPost.editedAt
                    ? `${formatRelativeTime(userPost.publishedAt)} · 수정됨`
                    : formatRelativeTime(userPost.publishedAt)
                }
              />
            ) : null}
            {isOwner ? (
              <ReportMenu onEdit={openEditComposer} onDelete={openDeleteConfirm} />
            ) : null}
          </div>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
            {userPost.body}
          </p>
          {userPost.imageUrl ? (
            // 카드 컴포넌트(@uandi/ui)와 동일하게 referrer-safe <img> 사용 — next/image 호스트 화이트리스트 회피
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userPost.imageUrl}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full rounded-lg"
            />
          ) : null}
        </article>
      </main>
    </>
  );
}
