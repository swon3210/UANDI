'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FullScreenSpinner,
  Sheet,
  SourceForm,
  SourceListItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@uandi/ui';
import { PageHeader } from '@/components/shell/PageHeader';
import { useIsAdmin, useModerationLists, useModeratePost } from '@/hooks/useCommunityAdmin';
import {
  useCommunitySources,
  useCreateSource,
  useDeleteSource,
  useTriggerCrawl,
  useUpdateSource,
} from '@/hooks/useCommunitySources';
import { discoverFeed } from '@/services/community-sources';
import type { AdminCommunityPost, ModerateAction } from '@/services/community-admin';
import type { CommunitySourceView } from '@/services/community-sources';

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

function SourcesPanel({ enabled }: { enabled: boolean }) {
  const { data: sources, isLoading } = useCommunitySources(enabled);
  const createSource = useCreateSource();
  const updateSource = useUpdateSource();
  const deleteSource = useDeleteSource();
  const crawl = useTriggerCrawl();

  const openSourceForm = (source?: CommunitySourceView) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SourceForm
          mode={source ? 'edit' : 'create'}
          initialSiteName={source?.siteName ?? ''}
          initialFeedUrl={source?.feedUrl ?? ''}
          onDiscover={async (url) => {
            try {
              return await discoverFeed(url);
            } catch {
              return null;
            }
          }}
          onSubmit={async ({ siteName, feedUrl }) => {
            try {
              if (source) {
                await updateSource.mutateAsync({ id: source.id, siteName, feedUrl });
                toast.success('소스를 수정했어요');
              } else {
                await createSource.mutateAsync({ siteName, feedUrl });
                toast.success('소스를 추가했어요');
              }
              close();
              setTimeout(unmount, 300);
            } catch {
              toast.error('처리하지 못했어요. 잠시 후 다시 시도해주세요.');
            }
          }}
        />
      </Sheet>
    ));
  };

  const handleToggle = async (source: CommunitySourceView, nextEnabled: boolean) => {
    try {
      await updateSource.mutateAsync({ id: source.id, enabled: nextEnabled });
    } catch {
      toast.error('상태를 변경하지 못했어요.');
    }
  };

  const openDeleteConfirm = async (source: CommunitySourceView) => {
    const confirmed = await overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
      <Dialog open={isOpen} onOpenChange={(open) => !open && close(false)}>
        <DialogContent data-testid="source-delete-dialog">
          <DialogHeader>
            <DialogTitle>소스를 삭제할까요?</DialogTitle>
            <DialogDescription>
              삭제해도 이미 수집된 글은 남아요. 이후 이 소스에서는 더 이상 수집하지 않아요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                close(false);
                setTimeout(unmount, 300);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                close(true);
                setTimeout(unmount, 300);
              }}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ));
    if (!confirmed) return;
    try {
      await deleteSource.mutateAsync(source.id);
      toast.success('소스를 삭제했어요');
    } catch {
      toast.error('삭제하지 못했어요.');
    }
  };

  const handleCrawl = async () => {
    try {
      const result = await crawl.mutateAsync();
      // 0건이 나오는 모든 경우를 설명한다 — 조용한 "0건"으로 끝내지 않는다.
      // 구체적 실패 사유는 '소스 관리' 목록의 각 소스 '수집 오류'에 표시된다.
      const failed = result.sources.filter((s) => s.emptyFeed || s.error).map((s) => s.siteName);
      if (result.sources.length === 0) {
        // 활성화된 소스가 하나도 없으면 크롤할 대상 자체가 없다.
        toast.warning('활성화된 소스가 없어요. 소스를 추가하거나 활성화한 뒤 다시 시도하세요.');
      } else if (failed.length > 0) {
        toast.warning(
          `새 글 ${result.created}건 · 수집 실패: ${failed.join(', ')} — '소스 관리'에서 사유를 확인하세요.`
        );
      } else if (result.created === 0 && result.skipped > 0) {
        // 피드는 정상이지만 전부 이미 수집된 글이라 새로 추가된 게 없다(중복 스킵).
        toast.info(
          `새 글 0건 — 이미 수집된 ${result.skipped}건을 건너뛰었어요. '승인 대기' 탭에서 확인하세요.`
        );
      } else {
        toast.success(`수집 완료 — 새 글 ${result.created}건`);
      }
    } catch {
      toast.error('수집에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const isMutating =
    createSource.isPending || updateSource.isPending || deleteSource.isPending;

  return (
    <div className="space-y-4 pt-4">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => openSourceForm()}>
          <Plus size={16} className="mr-1" />
          소스 추가
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCrawl}
          disabled={crawl.isPending}
          data-testid="crawl-now"
        >
          <RefreshCw size={16} className={`mr-1 ${crawl.isPending ? 'animate-spin' : ''}`} />
          {crawl.isPending ? '수집 중...' : '지금 수집'}
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : sources && sources.length > 0 ? (
          sources.map((source) => (
            <SourceListItem
              key={source.id}
              source={source}
              isPending={isMutating}
              onToggle={(nextEnabled) => handleToggle(source, nextEnabled)}
              onEdit={() => openSourceForm(source)}
              onDelete={() => openDeleteConfirm(source)}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">등록된 소스가 없어요.</p>
        )}
      </div>
    </div>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">승인 대기</TabsTrigger>
            <TabsTrigger value="reported">신고됨</TabsTrigger>
            <TabsTrigger value="sources">소스 관리</TabsTrigger>
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
          <TabsContent value="sources">
            <SourcesPanel enabled={enabled} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
