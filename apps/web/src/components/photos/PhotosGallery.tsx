'use client';

import { useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  Header,
  EmptyState,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Skeleton,
  Sheet,
} from '@uandi/ui';
import { useAuth } from '@/hooks/useAuth';
import {
  useInfinitePhotos,
  usePhotoStats,
  useUploadPhotos,
} from '@/hooks/usePhotos';
import { useFolders, useInfiniteFolders, useCreateFolder } from '@/hooks/useFolders';
import { useUploaderAvatars } from '@/hooks/useCoupleMembers';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { BottomNav } from '@/components/BottomNav';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { FolderCard } from '@/components/photos/FolderCard';
import { CreateFolderSheet } from '@/components/photos/CreateFolderSheet';
import { PhotoUploadSheet } from '@/components/photos/PhotoUploadSheet';
import Link from 'next/link';

function AllPhotosTab({ coupleId, uploaderAvatars }: { coupleId: string; uploaderAvatars?: Record<string, string | null> }) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfinitePhotos(coupleId);

  const photos = data?.pages.flatMap((p) => p.photos) ?? [];

  const sentinelRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (isLoading) {
    return <PhotoGrid photos={[]} isLoading />;
  }

  if (photos.length === 0) {
    return (
      <EmptyState
        icon="📷"
        title="아직 사진이 없어요"
        description="소중한 순간을 함께 기록해보세요"
        action={
          <Button disabled>
            첫 사진 올리기
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PhotoGrid photos={photos} uploaderAvatars={uploaderAvatars} />
      {isFetchingNextPage && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

function FoldersTab({ coupleId }: { coupleId: string }) {
  const { user } = useAuth();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteFolders(coupleId, null);
  const createMutation = useCreateFolder(coupleId);

  const folders = data?.pages.flatMap((p) => p.folders) ?? [];

  const sentinelRef = useInfiniteScroll({
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const handleCreateFolder = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <CreateFolderSheet
          isPending={createMutation.isPending}
          onSubmit={async (name) => {
            await createMutation.mutateAsync({ name, userId: user!.uid });
            close();
            setTimeout(unmount, 300);
          }}
        />
      </Sheet>
    ));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end px-4 py-2">
        <Button variant="ghost" size="sm" onClick={handleCreateFolder} data-testid="create-folder-btn">
          <Plus size={16} className="mr-1" />
          새 폴더
        </Button>
      </div>
      {folders.length === 0 ? (
        <EmptyState
          icon="📁"
          title="폴더를 만들어 사진을 정리해보세요"
          description="여행, 일상 등 주제별로 사진을 분류할 수 있어요"
          action={
            <Button onClick={handleCreateFolder}>
              새 폴더 만들기
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
            />
          ))}
        </div>
      )}
      {isFetchingNextPage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

function TagsTab({ coupleId }: { coupleId: string }) {
  const { data: stats, isLoading, error } = usePhotoStats(coupleId);
  const tags = stats?.tags;

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-destructive">
          태그를 불러오지 못했어요: {error.message}
        </p>
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <EmptyState
        icon="🏷️"
        title="사진에 태그를 추가해보세요"
        description="태그로 사진을 쉽게 찾을 수 있어요"
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {tags.map((tag) => (
        <Link key={tag.name} href={`/photos/tag/${encodeURIComponent(tag.name)}`}>
          <Badge variant="secondary" className="cursor-pointer text-sm py-1.5 px-3">
            #{tag.name} ({tag.count})
          </Badge>
        </Link>
      ))}
    </div>
  );
}

export function PhotosGallery() {
  const { user } = useAuth();
  const coupleId = user?.coupleId ?? null;
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') ?? 'all';
  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete('tab');
      } else {
        params.set('tab', value);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : '/photos');
    },
    [searchParams, router]
  );
  const { data: folders } = useFolders(coupleId);
  const createFolderMutation = useCreateFolder(coupleId);
  const needStats = activeTab === 'folders' || activeTab === 'tags';
  const { data: stats } = usePhotoStats(needStats ? coupleId : null);
  const uploadMutation = useUploadPhotos();
  const uploaderAvatars = useUploaderAvatars(coupleId);

  const tagSuggestions = stats?.tags.map((t) => t.name) ?? [];

  const handleUpload = () => {
    if (!user || !coupleId) return;
    overlay.open(({ isOpen, close, unmount }) => (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <PhotoUploadSheet
          folders={folders ?? []}
          tagSuggestions={tagSuggestions}
          onCreateFolder={async (name) =>
            createFolderMutation.mutateAsync({ name, userId: user.uid })
          }
          onSubmit={async (data, onProgress) => {
            try {
              await uploadMutation.mutateAsync({
                files: data.files.map((f) => ({
                  file: f.file,
                  width: f.width,
                  height: f.height,
                })),
                coupleId,
                uploadedBy: user.uid,
                folderId: data.folderId,
                tags: data.tags,
                caption: data.caption,
                takenAt: dayjs(data.takenAt).toDate(),
                onProgress,
              });
              close();
              setTimeout(unmount, 300);
            } catch {
              toast.error('사진 업로드에 실패했어요. 다시 시도해주세요.');
              throw new Error('upload failed');
            }
          }}
        />
      </Sheet>
    ));
  };

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <Header
        title="사진"
        rightSlot={
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUpload}
            aria-label="사진 업로드"
            data-auth-ready={!!user && !!coupleId ? 'true' : 'false'}
          >
            <Plus size={20} />
          </Button>
        }
      />
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none bg-background h-11">
            <TabsTrigger value="all" className="flex-1" data-testid="tab-all">
              전체
            </TabsTrigger>
            <TabsTrigger value="folders" className="flex-1" data-testid="tab-folders">
              폴더
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex-1" data-testid="tab-tags">
              태그
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="flex-1 mt-0">
            {coupleId && <AllPhotosTab coupleId={coupleId} uploaderAvatars={uploaderAvatars} />}
          </TabsContent>
          <TabsContent value="folders" className="flex-1 mt-0">
            {coupleId && <FoldersTab coupleId={coupleId} />}
          </TabsContent>
          <TabsContent value="tags" className="flex-1 mt-0">
            {coupleId && <TagsTab coupleId={coupleId} />}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav activeTab="photos" />
    </div>
  );
}
