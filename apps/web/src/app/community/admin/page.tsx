'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Button,
  FullScreenSpinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import { useIsAdmin, useModerationLists, useModeratePost } from '@/hooks/useCommunityAdmin';
import type { AdminCommunityPost, ModerateAction } from '@/services/community-admin';

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR');
}

function PendingCard({
  post,
  onAction,
  isPending,
}: {
  post: AdminCommunityPost;
  onAction: (action: ModerateAction) => void;
  isPending: boolean;
}) {
  return (
    <article
      data-testid="admin-pending-card"
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          {post.title ? <h3 className="font-medium">{post.title}</h3> : null}
          {post.source ? (
            <p className="text-xs text-muted-foreground">
              {post.source.siteName} ·{' '}
              <a
                href={post.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                원문 확인
              </a>
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">생성: {formatDate(post.createdAt)}</p>
        </div>
      </div>
      {post.body ? (
        <p className="whitespace-pre-wrap text-sm text-foreground">{post.body}</p>
      ) : null}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onAction('approve')}
          disabled={isPending}
        >
          승인
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction('reject')}
          disabled={isPending}
        >
          반려
        </Button>
      </div>
    </article>
  );
}

function ReportedCard({
  post,
  onAction,
  isPending,
}: {
  post: AdminCommunityPost;
  onAction: (action: ModerateAction) => void;
  isPending: boolean;
}) {
  return (
    <article
      data-testid="admin-reported-card"
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            작성자: {post.author?.displayName ?? '익명'} · 신고 {post.reportCount}건
          </p>
          <p className="text-xs text-muted-foreground">생성: {formatDate(post.createdAt)}</p>
        </div>
      </div>
      {post.body ? (
        <p className="whitespace-pre-wrap text-sm text-foreground">{post.body}</p>
      ) : null}
      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="max-h-40 rounded-lg"
        />
      ) : null}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onAction('hide')}
          disabled={isPending}
        >
          숨김
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAction('keep')}
          disabled={isPending}
        >
          유지
        </Button>
      </div>
    </article>
  );
}

export default function CommunityAdminPage() {
  const router = useRouter();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const enabled = isAdmin === true;
  const { data, isLoading } = useModerationLists(enabled);
  const moderate = useModeratePost();

  useEffect(() => {
    if (!isAdminLoading && isAdmin === false) {
      router.replace('/community');
    }
  }, [isAdmin, isAdminLoading, router]);

  if (isAdminLoading || isAdmin === undefined) {
    return <FullScreenSpinner />;
  }
  if (isAdmin === false) {
    return <FullScreenSpinner />;
  }

  const handleAction = async (postId: string, action: ModerateAction) => {
    try {
      await moderate.mutateAsync({ postId, action });
      const msg =
        action === 'approve'
          ? '승인했어요'
          : action === 'reject' || action === 'hide'
            ? '숨겼어요'
            : '유지했어요';
      toast.success(msg);
    } catch {
      toast.error('처리하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <>
      <PageHeader title="모더레이션" />
      <main
        data-testid="community-admin"
        className="mx-auto max-w-md px-4 pb-8 pt-4"
      >
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">승인 대기</TabsTrigger>
            <TabsTrigger value="reported">신고됨</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-3 pt-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : data && data.pending.length > 0 ? (
              data.pending.map((post) => (
                <PendingCard
                  key={post.id}
                  post={post}
                  isPending={moderate.isPending}
                  onAction={(action) => handleAction(post.id, action)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">승인 대기 글이 없어요.</p>
            )}
          </TabsContent>
          <TabsContent value="reported" className="space-y-3 pt-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : data && data.reported.length > 0 ? (
              data.reported.map((post) => (
                <ReportedCard
                  key={post.id}
                  post={post}
                  isPending={moderate.isPending}
                  onAction={(action) => handleAction(post.id, action)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">신고된 글이 없어요.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
